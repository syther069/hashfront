// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ITapeOutProcessor, ISiteRegistry, ITapeSendHub} from "../../src/interfaces/ITapeOut.sol";

/// @notice Test processor that stores real TAP-02 netlists and evaluates them (NAND only),
///         so ReleaseGate tests run against the exact bytes we will tape out.
contract MockProcessor is ITapeOutProcessor {
    struct C {
        uint32 nIn;
        uint32 nOut;
        bytes net;
        address owner;
    }

    mapping(uint256 => C) internal cs;
    uint256 public nextId = 1;

    function tapeout(bytes calldata net, uint32 nIn, uint32 nOut) external returns (uint256 id) {
        id = nextId++;
        cs[id] = C(nIn, nOut, net, msg.sender);
    }

    function circuitInfo(uint256 id) external view returns (uint32, uint32, uint32, uint32) {
        return (cs[id].nIn, cs[id].nOut, 0, uint32(cs[id].net.length / 7));
    }

    function netlist(uint256 id) external view returns (bytes memory) {
        return cs[id].net;
    }

    function ownerOf(uint256 id) external view returns (address) {
        return cs[id].owner;
    }

    function safeTransferFrom(address from, address to, uint256 id) external {
        require(cs[id].owner == from && msg.sender == from, "not owner");
        cs[id].owner = to;
    }

    function eval(uint256 id, bytes calldata inputs) external view returns (bytes memory out) {
        C storage c = cs[id];
        require(c.net.length > 0, "no circuit");
        bytes memory net = c.net;
        uint256 nSig = 2 + c.nIn + net.length / 7;
        uint8[] memory s = new uint8[](nSig);
        s[1] = 1;
        for (uint256 i; i < c.nIn; ++i) {
            uint256 byteI = i >> 3;
            if (byteI < inputs.length) s[2 + i] = (uint8(inputs[byteI]) >> (i & 7)) & 1;
        }
        uint256 k = 2 + c.nIn;
        for (uint256 p; p < net.length; p += 7) {
            require(uint8(net[p]) == 0, "mock: NAND only");
            uint256 a = (uint256(uint8(net[p + 1])) << 16) | (uint256(uint8(net[p + 2])) << 8) | uint8(net[p + 3]);
            uint256 b = (uint256(uint8(net[p + 4])) << 16) | (uint256(uint8(net[p + 5])) << 8) | uint8(net[p + 6]);
            require(a < k && b < k, "forward ref");
            s[k++] = 1 - (s[a] & s[b]);
        }
        out = new bytes((c.nOut + 7) / 8);
        uint256 first = nSig - c.nOut;
        for (uint256 i; i < c.nOut; ++i) {
            // forge-lint: disable-next-line(incorrect-shift) -- setting bit i of a mask
            if (s[first + i] == 1) out[i >> 3] = bytes1(uint8(out[i >> 3]) | uint8(1 << (i & 7)));
        }
    }
}

/// @notice Test double for SiteRegistry: same editor rule, chunk ordering and limits; chunks stored separately.
contract MockSiteRegistry is ISiteRegistry {
    struct F {
        string contentType;
        bytes32 sha;
        bytes[] chunks;
        uint32 size;
        uint40 updatedAt;
    }

    mapping(address => address) public editor; // container => allowed writer
    mapping(address => mapping(string => F)) internal files;
    mapping(address => string) public fallbackOf;

    function setEditor(address container, address who) external {
        editor[container] = who;
    }

    modifier onlyEditor(address container) {
        require(msg.sender == editor[container], "not editor");
        _;
    }

    function putFile(address c, string calldata path, string calldata ct, bytes32 sha, bytes calldata data)
        external
        onlyEditor(c)
    {
        require(data.length <= 24000, "chunk too big");
        delete files[c][path];
        F storage f = files[c][path];
        f.contentType = ct;
        f.sha = sha;
        f.chunks.push(data);
        f.size = uint32(data.length);
        f.updatedAt = uint40(block.timestamp);
    }

    function appendChunk(address c, string calldata path, uint256 expectIndex, bytes calldata data)
        external
        onlyEditor(c)
    {
        F storage f = files[c][path];
        require(f.chunks.length > 0 && f.chunks.length == expectIndex && f.chunks.length < 350, "bad index");
        require(data.length <= 24000, "chunk too big");
        f.chunks.push(data);
        f.size += uint32(data.length);
        f.updatedAt = uint40(block.timestamp);
    }

    function removeFile(address c, string calldata path) external onlyEditor(c) {
        delete files[c][path];
    }

    function setFallback(address c, string calldata path) external onlyEditor(c) {
        fallbackOf[c] = path;
    }

    function setOperator(address, address, uint256) external pure {}

    function fileInfo(address c, string calldata path)
        external
        view
        returns (uint32, string memory, bytes32, uint40, uint256)
    {
        F storage f = files[c][path];
        return (f.size, f.contentType, f.sha, f.updatedAt, f.chunks.length);
    }

    function fallbackPath(address c) external view returns (string memory) {
        return fallbackOf[c];
    }

    function read(address c, string calldata path) public view returns (bytes memory out) {
        bytes[] storage parts = files[c][path].chunks;
        for (uint256 i; i < parts.length; ++i) {
            out = bytes.concat(out, parts[i]);
        }
    }

    function readRange(address c, string calldata path, uint256 offset, uint256 len)
        external
        view
        returns (bytes memory out)
    {
        bytes memory d = read(c, path);
        if (offset >= d.length) return out;
        uint256 end = offset + len > d.length ? d.length : offset + len;
        out = new bytes(end - offset);
        for (uint256 i; i < out.length; ++i) {
            out[i] = d[offset + i];
        }
    }
}

/// @notice Records TapeSend messages like the real hub: only the circuit's current holder may send,
///         and `failFor` makes sends to one endpoint revert (a hub failure after an upgrade, say).
contract MockTapeSendHub is ITapeSendHub {
    struct Sent {
        address circuits;
        uint256 tokenId;
        bytes32 to;
        bytes32 payloadHash; // hash only: storing the bytes would cost more gas than the real hub uses
    }

    Sent[] public sent;
    mapping(bytes32 => uint256) public inboxCount;
    bytes32 public failFor;

    function setFailFor(bytes32 to) external {
        failFor = to;
    }

    function send(address circuits, uint256 tokenId, bytes32 to, bytes32, bytes calldata payload)
        external
        returns (uint256 inboxIndex)
    {
        if (to == failFor) revert("hub down");
        require(ITapeOutProcessor(circuits).ownerOf(tokenId) == msg.sender, "NotHolder");
        require(payload.length > 0 && payload.length <= 16_000, "payload size");
        sent.push(Sent(circuits, tokenId, to, keccak256(payload)));
        inboxIndex = inboxCount[to]++;
    }

    function endpointOf(address container) external view returns (bytes32) {
        return bytes32((block.chainid << 160) | uint256(uint160(container)));
    }

    function sentCount() external view returns (uint256) {
        return sent.length;
    }

    function payloadHashAt(uint256 i) external view returns (bytes32) {
        return sent[i].payloadHash;
    }
}
