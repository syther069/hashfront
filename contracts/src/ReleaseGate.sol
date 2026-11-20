// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ITapeOutProcessor, ISiteRegistry, ITapeSendHub} from "./interfaces/ITapeOut.sol";

/// @title Hashfront ReleaseGate
/// @notice Holds a site's circuit NFT and is the only editor of its DeWEB site.
///         A frontend release goes live only when the onchain TapeOut policy circuit says yes.
///
/// Release flow (approve first, upload second):
///   1. uploader     propose(root, totalChunks)
///   2. maintainers  approve(id, root, totalChunks)       binds the exact bytes of the build
///   3. uploader     writeChunk with a proof per 24 KB chunk (after >= 2 approvals)
///   4. uploader     seal(id)                             only when every chunk is on chain; starts the timelock
///   5. anyone       activate(id)                         policy.eval(bits) must return 1
///
/// Manifest leaves, one per chunk:
///   keccak256(bytes.concat(keccak256(abi.encode(path, contentType, fileSha256, chunkIndex, chunkSha256))))
/// The gate recomputes sha256(chunk) on chain, so no unapproved byte, path or content type can be written.
///
/// Governance: any maintainer can freeze or cancel a release; unfreezing and site migration need all three;
/// replacing a maintainer, the uploader or the reporter needs two. Rotation advances the epoch, voiding pending
/// votes and earlier approvals.
///
/// Alerts: the reporter (the watcher's key) or any maintainer can send a TapeSend alert as the site's container.
/// The message text is fixed on chain and never contains a link, so a leaked reporter key can raise a false alarm
/// or post a false all-clear (which also clears `lastAlert` on status pages), but can never send users anywhere.
/// Maintainers can rotate the reporter with two votes.
contract ReleaseGate {
    // ---------------------------------------------------------------- types
    struct Release {
        bytes32 root;
        uint64 proposedAt;
        uint64 sealedAt;
        uint32 totalChunks;
        uint32 uploadedChunks;
        uint32 epoch; // maintainer epoch the approvals belong to
        uint8 approvals; // bitmask over maintainer slots
        bool cancelled;
        bool activated;
    }

    /// @notice One 24 KB (max) piece of a release file, with its Merkle proof.
    struct Chunk {
        string path; // release-relative, e.g. "assets/app.js"
        string contentType;
        bytes32 fileSha256; // sha256 of the whole file, declared to the registry
        uint256 index; // 0-based chunk index
        bytes data;
        bytes32[] proof;
    }

    // ---------------------------------------------------------------- immutables
    ITapeOutProcessor public immutable processor;
    uint256 public immutable policyId; // the circuit NFT this gate holds; its container hosts the site
    ISiteRegistry public immutable registry;
    address public immutable container;
    uint64 public immutable timelock;
    ITapeSendHub public immutable hub; // zero disables TapeSend delivery; the Alert event is always emitted

    uint8 public constant ALERT_MISMATCH = 1; // normal website serves files that differ from the live release
    uint8 public constant ALERT_DNS_CHANGED = 2; // A/NS records changed from the baseline
    uint8 public constant ALERT_RESOLVED = 3; // normal website matches the live release again
    uint256 public constant MAX_ALERT_RECIPIENTS = 8;
    /// @dev Gas reserved for each hub.send. Checked before the call, so a gas estimate can never settle on a
    ///      limit where the delivery silently fails inside try/catch and only the event lands.
    uint256 public constant ALERT_SEND_GAS = 400_000;

    // ---------------------------------------------------------------- state
    address[3] public maintainers;
    address public uploader;
    address public reporter;
    bool public frozen;
    uint32 public epoch;
    uint256 public releaseCount;
    uint256 public liveRelease;
    bool public migrated;
    /// @notice The most recent alert, so a status page or badge can show "open alert since ..." without scanning
    ///         logs (public RPCs cap eth_getLogs ranges). kind 0 = never alerted; ALERT_RESOLVED closes an incident.
    ///         There is no heartbeat: "no open alert" also means "the watcher has not reported a problem".
    struct LastAlert {
        uint8 kind;
        uint64 at;
        uint64 release;
        bytes32 observed;
    }
    LastAlert public lastAlert;

    mapping(uint256 id => Release) public releases;
    mapping(uint256 id => mapping(bytes32 leaf => bool)) public chunkWritten;
    /// @dev votes[epoch][actionHash] = bitmask of maintainer slots
    mapping(uint32 epoch => mapping(bytes32 action => uint8)) public votes;

    // ---------------------------------------------------------------- events
    event Proposed(uint256 indexed id, bytes32 root, uint32 totalChunks);
    event Approved(uint256 indexed id, address indexed maintainer, bytes32 root);
    event ChunkWritten(uint256 indexed id, string path, uint256 index);
    event Sealed(uint256 indexed id);
    event Cancelled(uint256 indexed id, address indexed by);
    event Activated(uint256 indexed id, bytes32 root, uint8 policyBits);
    event Frozen(address indexed by);
    event Unfrozen();
    event Voted(bytes32 indexed action, address indexed maintainer, uint8 votes);
    event MaintainerReplaced(uint8 indexed slot, address previous, address next, uint32 epoch);
    event UploaderChanged(address uploader);
    event SiteMigrated(address to);
    event ReporterChanged(address reporter);
    event Alert(uint8 indexed kind, bytes32 observed, uint256 liveRelease, uint256 delivered, uint256 failed);

    // ---------------------------------------------------------------- errors
    error NotMaintainer();
    error NotUploader();
    error UnknownRelease();
    error AlreadySealed();
    error NotSealed();
    error ReleaseCancelled();
    error WrongManifest();
    error NotEnoughApprovals();
    error BadProof();
    error BadPath();
    error ChunkAlreadyWritten();
    error Incomplete(uint32 uploaded, uint32 total);
    error PolicyRejected(uint8 bits);
    error NotNewer();
    error AlreadyLive();
    error AlreadyMaintainer();
    error BadSlot();
    error ZeroValue();
    error SiteGone();
    error BadAlert();
    error AlertGas();

    constructor(
        ITapeOutProcessor processor_,
        uint256 policyId_,
        ISiteRegistry registry_,
        address container_,
        address[3] memory maintainers_,
        address uploader_,
        address reporter_,
        ITapeSendHub hub_,
        uint64 timelock_
    ) {
        for (uint256 i; i < 3; ++i) {
            if (maintainers_[i] == address(0)) revert ZeroValue();
            for (uint256 j; j < i; ++j) {
                if (maintainers_[i] == maintainers_[j]) revert AlreadyMaintainer();
            }
        }
        if (uploader_ == address(0) || reporter_ == address(0) || container_ == address(0)) revert ZeroValue();
        processor = processor_;
        policyId = policyId_;
        registry = registry_;
        container = container_;
        maintainers = maintainers_;
        uploader = uploader_;
        reporter = reporter_;
        hub = hub_;
        timelock = timelock_;
    }

    // ================================================================ uploader
    modifier onlyUploader() {
        if (msg.sender != uploader) revert NotUploader();
        _;
    }

    modifier live() {
        if (migrated) revert SiteGone();
        _;
    }

    function propose(bytes32 root, uint32 totalChunks) external onlyUploader live returns (uint256 id) {
        if (root == bytes32(0) || totalChunks == 0) revert ZeroValue();
        id = ++releaseCount;
        Release storage r = releases[id];
        r.root = root;
        r.totalChunks = totalChunks;
        r.proposedAt = uint64(block.timestamp);
        r.epoch = epoch;
        emit Proposed(id, root, totalChunks);
    }

    /// @notice Writes one approved chunk. Chunk 0 creates the file; later chunks append in order
    ///         (the registry rejects out-of-order indexes).
    function writeChunk(uint256 id, Chunk calldata c) external onlyUploader live {
        Release storage r = _release(id);
        if (r.cancelled) revert ReleaseCancelled();
        if (r.sealedAt != 0) revert AlreadySealed();
        if (r.epoch != epoch || _count(r.approvals) < 2) revert NotEnoughApprovals();
        if (c.fileSha256 == bytes32(0)) revert ZeroValue();

        bytes32 l = leaf(c.path, c.contentType, c.fileSha256, c.index, sha256(c.data));
        if (!_verify(c.proof, r.root, l)) revert BadProof();
        if (chunkWritten[id][l]) revert ChunkAlreadyWritten();
        chunkWritten[id][l] = true;
        ++r.uploadedChunks;

        string memory full = _stagedPath(id, c.path);
        if (c.index == 0) registry.putFile(container, full, c.contentType, c.fileSha256, c.data);
        else registry.appendChunk(container, full, c.index, c.data);
        emit ChunkWritten(id, c.path, c.index);
    }

    function seal(uint256 id) external onlyUploader live {
        Release storage r = _release(id);
        if (r.cancelled) revert ReleaseCancelled();
        if (r.sealedAt != 0) revert AlreadySealed();
        if (r.uploadedChunks != r.totalChunks) revert Incomplete(r.uploadedChunks, r.totalChunks);
        r.sealedAt = uint64(block.timestamp);
        emit Sealed(id);
    }

    // ================================================================ maintainers
    function approve(uint256 id, bytes32 root, uint32 totalChunks) external live {
        uint8 slot = _slot(msg.sender);
        Release storage r = _release(id);
        if (r.cancelled) revert ReleaseCancelled();
        if (r.root != root || r.totalChunks != totalChunks) revert WrongManifest();
        if (r.epoch != epoch) {
            // maintainers changed since the last approval: start over under the new set
            r.epoch = epoch;
            r.approvals = 0;
        }
        // forge-lint: disable-next-line(incorrect-shift)
        r.approvals |= uint8(1 << slot); // bitmask over maintainer slots
        emit Approved(id, msg.sender, root);
    }

    /// @notice Any single maintainer can permanently cancel a release that is not live.
    function cancel(uint256 id) external {
        _slot(msg.sender);
        Release storage r = _release(id);
        if (r.activated) revert AlreadyLive();
        r.cancelled = true;
        emit Cancelled(id, msg.sender);
    }

    /// @notice Incident button: any single maintainer blocks all activations.
    function freeze() external {
        _slot(msg.sender);
        frozen = true;
        emit Frozen(msg.sender);
    }

    function voteUnfreeze() external {
        if (_vote(keccak256("unfreeze")) == 7) {
            frozen = false;
            delete votes[epoch][keccak256("unfreeze")];
            emit Unfrozen();
        }
    }

    /// @notice Two maintainers can replace a third (e.g. a lost key). Advances the epoch.
    function voteReplaceMaintainer(uint8 slot, address next) external {
        if (slot > 2) revert BadSlot();
        if (next == address(0)) revert ZeroValue();
        for (uint256 i; i < 3; ++i) {
            if (maintainers[i] == next) revert AlreadyMaintainer();
        }
        uint8 v = _vote(keccak256(abi.encode("replace", slot, next)));
        if (_count(v) >= 2) {
            address previous = maintainers[slot];
            maintainers[slot] = next;
            ++epoch;
            emit MaintainerReplaced(slot, previous, next, epoch);
        }
    }

    function voteSetUploader(address next) external {
        if (next == address(0)) revert ZeroValue();
        bytes32 action = keccak256(abi.encode("uploader", next));
        if (_count(_vote(action)) >= 2) {
            uploader = next;
            delete votes[epoch][action];
            emit UploaderChanged(next);
        }
    }

    function voteSetReporter(address next) external {
        if (next == address(0)) revert ZeroValue();
        bytes32 action = keccak256(abi.encode("reporter", next));
        if (_count(_vote(action)) >= 2) {
            reporter = next;
            delete votes[epoch][action];
            emit ReporterChanged(next);
        }
    }

    /// @notice Escape hatch: all three maintainers can move the site NFT to a new holder (e.g. a new gate).
    function voteMigrate(address to) external live {
        if (to == address(0)) revert ZeroValue();
        if (_vote(keccak256(abi.encode("migrate", to))) == 7) {
            migrated = true;
            processor.safeTransferFrom(address(this), to, policyId);
            emit SiteMigrated(to);
        }
    }

    // ================================================================ alerts
    /// @notice Sends a fixed-text public TapeSend alert from the site's container to each endpoint in `to`
    ///         (TAP-10 endpoint ids). A failed delivery is counted, not reverted, so the Alert event always lands.
    /// @param observed evidence hash from the watcher (sha256 of what the normal website served, or of the DNS answer)
    function alert(uint8 kind, bytes32 observed, bytes32[] calldata to) external live {
        if (msg.sender != reporter) _slot(msg.sender); // anyone else must be a maintainer
        if (to.length > MAX_ALERT_RECIPIENTS) revert BadAlert();
        bytes memory payload = alertPayload(kind, observed); // reverts BadAlert on an unknown kind
        // stored before the send loop, so the AlertGas check still leaves the post-loop margin for the event
        // casting to uint64 is safe: timestamps and release ids stay far below 2^64
        // forge-lint: disable-next-line(unsafe-typecast)
        lastAlert = LastAlert(kind, uint64(block.timestamp), uint64(liveRelease), observed);
        bool hubLive = address(hub).code.length != 0;
        uint256 delivered;
        for (uint256 i; i < to.length; ++i) {
            if (!hubLive) break;
            if (gasleft() < ALERT_SEND_GAS + 50_000) revert AlertGas();
            try hub.send{gas: ALERT_SEND_GAS}(address(processor), policyId, to[i], bytes32(0), payload) returns (
                uint256
            ) {
                ++delivered;
            } catch {}
        }
        emit Alert(kind, observed, liveRelease, delivered, to.length - delivered);
    }

    /// @notice The exact TapeSend payload of an alert: "TS", format 0x02, kind 0x00 (public), then TAP-10 section 6 JSON.
    ///         Only fixed ASCII text, decimal numbers and hex go into the JSON, so it needs no escaping.
    function alertPayload(uint8 kind, bytes32 observed) public view returns (bytes memory) {
        string memory v = _toString(liveRelease);
        string memory h = _toHex(observed);
        string memory subject;
        string memory body;
        if (kind == ALERT_MISMATCH) {
            subject = "Hashfront alert: website does not match the approved release";
            body = string.concat(
                "The usual website of this protocol is serving files that differ from approved release v",
                v,
                ". Do not connect your wallet or sign anything there. Use the Hashfront link you pinned earlier.",
                " Observed hash: ",
                h
            );
        } else if (kind == ALERT_DNS_CHANGED) {
            subject = "Hashfront alert: domain records changed";
            body = string.concat(
                "The DNS records of this protocol's usual website changed unexpectedly. Do not connect your wallet",
                " or sign anything there until the team confirms. Use the Hashfront link you pinned earlier.",
                " Observed hash: ",
                h
            );
        } else if (kind == ALERT_RESOLVED) {
            subject = "Hashfront: all clear";
            body = string.concat(
                "The usual website of this protocol matches approved release v", v, " again. Observed hash: ", h
            );
        } else {
            revert BadAlert();
        }
        return abi.encodePacked(hex"54530200", '{"v":1,"kind":"message","subject":"', subject, '","body":"', body, '"}');
    }

    // ================================================================ activation
    /// @notice Bits fed to the policy circuit (LSB-first): a1 a2 a3 timelockPassed frozen.
    function policyBits(uint256 id) public view returns (uint8 bits) {
        Release storage r = _release(id);
        bits = r.epoch == epoch ? r.approvals & 7 : 0;
        // forge-lint: disable-next-line(block-timestamp) -- seconds of drift are irrelevant to an hours-long timelock
        if (r.sealedAt != 0 && block.timestamp >= uint256(r.sealedAt) + timelock) bits |= 8;
        if (frozen) bits |= 16;
    }

    function wouldAllow(uint256 id) public view returns (bool) {
        Release storage r = _release(id);
        if (r.sealedAt == 0 || r.cancelled || id <= liveRelease || migrated) return false;
        return _eval(policyBits(id));
    }

    function activate(uint256 id) external live {
        Release storage r = _release(id);
        if (r.sealedAt == 0) revert NotSealed();
        if (r.cancelled) revert ReleaseCancelled();
        if (id <= liveRelease) revert NotNewer();
        uint8 bits = policyBits(id);
        if (!_eval(bits)) revert PolicyRejected(bits);

        r.activated = true;
        liveRelease = id;
        bytes memory html = rootHtml(id);
        registry.putFile(container, "index.html", "text/html; charset=utf-8", sha256(html), html);
        registry.setFallback(container, "index.html");
        emit Activated(id, r.root, bits);
    }

    /// @notice The root page is generated on chain, so nothing can be injected into it.
    function rootHtml(uint256 id) public pure returns (bytes memory) {
        string memory v = _toString(id);
        return abi.encodePacked(
            '<!doctype html><meta charset="utf-8"><title>Hashfront</title>',
            '<meta http-equiv="refresh" content="0;url=/releases/v',
            v,
            '/index.html">',
            '<a href="/releases/v',
            v,
            '/index.html">Open release v',
            v,
            "</a>"
        );
    }

    // ================================================================ views
    function leaf(
        string calldata relPath,
        string calldata contentType,
        bytes32 fileSha256,
        uint256 index,
        bytes32 chunkSha256
    ) public pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(relPath, contentType, fileSha256, index, chunkSha256))));
    }

    function approvalCount(uint256 id) external view returns (uint256) {
        Release storage r = _release(id);
        return r.epoch == epoch ? _count(r.approvals) : 0;
    }

    // ================================================================ ERC-721 receiver
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // ================================================================ internals
    function _vote(bytes32 action) internal returns (uint8 v) {
        uint8 slot = _slot(msg.sender);
        // forge-lint: disable-next-line(incorrect-shift)
        v = votes[epoch][action] | uint8(1 << slot); // bitmask over maintainer slots
        votes[epoch][action] = v;
        emit Voted(action, msg.sender, v);
    }

    function _slot(address who) internal view returns (uint8) {
        for (uint8 i; i < 3; ++i) {
            if (maintainers[i] == who) return i;
        }
        revert NotMaintainer();
    }

    function _release(uint256 id) internal view returns (Release storage r) {
        r = releases[id];
        if (r.proposedAt == 0) revert UnknownRelease();
    }

    function _eval(uint8 bits) internal view returns (bool) {
        bytes memory out = processor.eval(policyId, abi.encodePacked(bits));
        return out.length > 0 && (uint8(out[0]) & 1) == 1;
    }

    function _count(uint8 m) internal pure returns (uint256) {
        return (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1);
    }

    /// @dev Sorted-pair Merkle proof (OpenZeppelin MerkleProof compatible).
    function _verify(bytes32[] calldata proof, bytes32 root, bytes32 node) internal pure returns (bool) {
        for (uint256 i; i < proof.length; ++i) {
            bytes32 p = proof[i];
            node = node < p ? keccak256(abi.encode(node, p)) : keccak256(abi.encode(p, node));
        }
        return node == root;
    }

    /// @dev "releases/v{id}/<relPath>"; rejects empty, "." and ".." segments and a leading slash (TAP-10 rules).
    function _stagedPath(uint256 id, string calldata relPath) internal pure returns (string memory) {
        bytes calldata p = bytes(relPath);
        if (p.length == 0 || p[0] == "/") revert BadPath();
        uint256 segStart;
        for (uint256 k; k <= p.length; ++k) {
            if (k == p.length || p[k] == "/") {
                uint256 len = k - segStart;
                if (len == 0) revert BadPath();
                if (p[segStart] == "." && (len == 1 || (len == 2 && p[segStart + 1] == "."))) revert BadPath();
                segStart = k + 1;
            } else if (uint8(p[k]) < 0x20 || uint8(p[k]) == 0x7f) {
                revert BadPath();
            }
        }
        return string.concat("releases/v", _toString(id), "/", relPath);
    }

    function _toHex(bytes32 v) internal pure returns (string memory) {
        bytes memory out = new bytes(66);
        out[0] = "0";
        out[1] = "x";
        bytes16 digits = "0123456789abcdef";
        for (uint256 i; i < 32; ++i) {
            out[2 + 2 * i] = digits[uint8(v[i]) >> 4];
            out[3 + 2 * i] = digits[uint8(v[i]) & 15];
        }
        return string(out);
    }

    function _toString(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 len;
        for (uint256 t = v; t != 0; t /= 10) {
            ++len;
        }
        bytes memory b = new bytes(len);
        for (; v != 0; v /= 10) {
            b[--len] = bytes1(uint8(48 + (v % 10)));
        }
        return string(b);
    }
}
