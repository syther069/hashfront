// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ReleaseGate} from "../src/ReleaseGate.sol";
import {ITapeOutProcessor, ISiteRegistry, ITapeSendHub} from "../src/interfaces/ITapeOut.sol";
import {MockProcessor, MockSiteRegistry, MockTapeSendHub} from "./mocks/Mocks.sol";

contract ReleaseGateTest is Test {
    MockProcessor proc;
    MockSiteRegistry reg;
    ReleaseGate gate;
    uint256 policyId;
    address container = makeAddr("container");
    address m1 = makeAddr("m1");
    address m2 = makeAddr("m2");
    address m3 = makeAddr("m3");
    address ci = makeAddr("ci");
    address watcher = makeAddr("watcher");
    MockTapeSendHub hub;
    uint64 constant TIMELOCK = 1 days;

    // Test release: index.html (1 chunk) + assets/app.js (2 chunks) = 3 leaves.
    string constant HTML = "text/html; charset=utf-8";
    string constant JSCT = "text/javascript; charset=utf-8";
    bytes constant INDEX = "<h1>app</h1>";
    bytes constant JS0 = "console.log(";
    bytes constant JS1 = "'hashfront')";
    bytes32 shaIndex;
    bytes32 shaJs; // sha256 of the whole file
    bytes32 L0; // index.html #0
    bytes32 L1; // app.js #0
    bytes32 L2; // app.js #1
    bytes32 ROOT;
    uint32 constant TOTAL = 3;

    function setUp() public {
        proc = new MockProcessor();
        reg = new MockSiteRegistry();
        hub = new MockTapeSendHub();
        string memory json = vm.readFile(string.concat(vm.projectRoot(), "/../circuits/out/policy.json"));
        policyId = proc.tapeout(vm.parseJsonBytes(json, ".netlist"), 5, 1);

        gate = new ReleaseGate(
            ITapeOutProcessor(address(proc)),
            policyId,
            ISiteRegistry(address(reg)),
            container,
            [m1, m2, m3],
            ci,
            watcher,
            ITapeSendHub(address(hub)),
            TIMELOCK
        );
        proc.safeTransferFrom(address(this), address(gate), policyId);
        reg.setEditor(container, address(gate));

        shaIndex = sha256(INDEX);
        shaJs = sha256(bytes.concat(JS0, JS1));
        L0 = gate.leaf("index.html", HTML, shaIndex, 0, sha256(INDEX));
        L1 = gate.leaf("assets/app.js", JSCT, shaJs, 0, sha256(JS0));
        L2 = gate.leaf("assets/app.js", JSCT, shaJs, 1, sha256(JS1));
        ROOT = _pair(_pair(L0, L1), L2);
    }

    // ------------------------------------------------------------ helpers
    function _pair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b ? keccak256(abi.encode(a, b)) : keccak256(abi.encode(b, a));
    }

    function _p(bytes32 a) internal pure returns (bytes32[] memory p) {
        p = new bytes32[](1);
        p[0] = a;
    }

    function _p(bytes32 a, bytes32 b) internal pure returns (bytes32[] memory p) {
        p = new bytes32[](2);
        p[0] = a;
        p[1] = b;
    }

    function _c(
        string memory path,
        string memory ct,
        bytes32 fileSha,
        uint256 index,
        bytes memory data,
        bytes32[] memory proof
    ) internal pure returns (ReleaseGate.Chunk memory) {
        return ReleaseGate.Chunk({
            path: path, contentType: ct, fileSha256: fileSha, index: index, data: data, proof: proof
        });
    }

    function _propose() internal returns (uint256 id) {
        vm.prank(ci);
        id = gate.propose(ROOT, TOTAL);
    }

    function _approve(uint256 id, address m) internal {
        vm.prank(m);
        gate.approve(id, ROOT, TOTAL);
    }

    function _uploadAll(uint256 id) internal {
        vm.startPrank(ci);
        gate.writeChunk(id, _c("index.html", HTML, shaIndex, 0, INDEX, _p(L1, L2)));
        gate.writeChunk(id, _c("assets/app.js", JSCT, shaJs, 0, JS0, _p(L0, L2)));
        gate.writeChunk(id, _c("assets/app.js", JSCT, shaJs, 1, JS1, _p(_pair(L0, L1))));
        vm.stopPrank();
    }

    /// propose → 2 approvals → upload all chunks → seal
    function _staged() internal returns (uint256 id) {
        id = _propose();
        _approve(id, m1);
        _approve(id, m2);
        _uploadAll(id);
        vm.prank(ci);
        gate.seal(id);
    }

    // ------------------------------------------------------------ the circuit == the spec
    function test_policyCircuitTruthTable() public view {
        for (uint8 bits; bits < 32; ++bits) {
            bytes memory out = proc.eval(policyId, abi.encodePacked(bits));
            uint256 approvals = (bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1);
            bool expected = (bits & 16) == 0 && (((bits & 8) != 0 && approvals >= 2) || approvals == 3);
            assertEq(uint8(out[0]) & 1, expected ? 1 : 0);
        }
    }

    // ------------------------------------------------------------ constructor
    function test_constructorRejectsDuplicateMaintainers() public {
        vm.expectRevert(ReleaseGate.AlreadyMaintainer.selector);
        new ReleaseGate(
            ITapeOutProcessor(address(proc)),
            policyId,
            ISiteRegistry(address(reg)),
            container,
            [m1, m1, m3],
            ci,
            watcher,
            ITapeSendHub(address(hub)),
            1
        );
    }

    // ------------------------------------------------------------ upload binds every byte
    function test_chunksLandUnderReleasePrefix() public {
        _staged();
        assertEq(reg.read(container, "releases/v1/assets/app.js"), bytes.concat(JS0, JS1));
        (,, bytes32 sha,, uint256 chunks) = reg.fileInfo(container, "releases/v1/assets/app.js");
        assertEq(sha, shaJs);
        assertEq(chunks, 2);
    }

    function test_cannotUploadBeforeTwoApprovals() public {
        uint256 id = _propose();
        _approve(id, m1);
        bytes32[] memory proof = _p(L1, L2);
        vm.prank(ci);
        vm.expectRevert(ReleaseGate.NotEnoughApprovals.selector);
        gate.writeChunk(id, _c("index.html", HTML, shaIndex, 0, INDEX, proof));
    }

    function test_rejectsBytesNotInManifest() public {
        uint256 id = _propose();
        _approve(id, m1);
        _approve(id, m2);
        bytes32[] memory proof = _p(L1, L2);
        vm.startPrank(ci);
        vm.expectRevert(ReleaseGate.BadProof.selector);
        gate.writeChunk(id, _c("index.html", HTML, shaIndex, 0, "<script>drain()</script>", proof));
        vm.expectRevert(ReleaseGate.BadProof.selector); // approved bytes, different path
        gate.writeChunk(id, _c("evil.html", HTML, shaIndex, 0, INDEX, proof));
        vm.expectRevert(ReleaseGate.BadProof.selector); // approved bytes, different content type
        gate.writeChunk(id, _c("index.html", "image/svg+xml", shaIndex, 0, INDEX, proof));
        vm.stopPrank();
    }

    function test_chunkCannotMoveToAnotherIndex() public {
        uint256 id = _propose();
        _approve(id, m1);
        _approve(id, m2);
        bytes32[] memory p1 = _p(L0, L2); // proof for app.js chunk 0
        bytes32[] memory p2 = _p(_pair(L0, L1)); // proof for app.js chunk 1
        vm.startPrank(ci);
        vm.expectRevert(ReleaseGate.BadProof.selector); // chunk 1's bytes presented as chunk 0
        gate.writeChunk(id, _c("assets/app.js", JSCT, shaJs, 0, JS1, p1));
        vm.expectRevert(ReleaseGate.BadProof.selector); // chunk 1's bytes presented as chunk 2
        gate.writeChunk(id, _c("assets/app.js", JSCT, shaJs, 2, JS1, p2));
        vm.stopPrank();
    }

    function test_registryEnforcesChunkOrder() public {
        uint256 id = _propose();
        _approve(id, m1);
        _approve(id, m2);
        bytes32[] memory p2 = _p(_pair(L0, L1));
        vm.prank(ci);
        vm.expectRevert("bad index"); // chunk 1 before chunk 0 exists
        gate.writeChunk(id, _c("assets/app.js", JSCT, shaJs, 1, JS1, p2));
    }

    function test_chunkCannotBeWrittenTwice() public {
        uint256 id = _propose();
        _approve(id, m1);
        _approve(id, m2);
        bytes32[] memory proof = _p(L1, L2);
        vm.startPrank(ci);
        gate.writeChunk(id, _c("index.html", HTML, shaIndex, 0, INDEX, proof));
        vm.expectRevert(ReleaseGate.ChunkAlreadyWritten.selector);
        gate.writeChunk(id, _c("index.html", HTML, shaIndex, 0, INDEX, proof));
        vm.stopPrank();
    }

    function test_sealRequiresEveryChunk() public {
        uint256 id = _propose();
        _approve(id, m1);
        _approve(id, m2);
        bytes32[] memory proof = _p(L1, L2);
        vm.startPrank(ci);
        gate.writeChunk(id, _c("index.html", HTML, shaIndex, 0, INDEX, proof));
        vm.expectRevert(abi.encodeWithSelector(ReleaseGate.Incomplete.selector, uint32(1), uint32(3)));
        gate.seal(id);
        vm.stopPrank();
    }

    function test_cannotWriteAfterSeal() public {
        uint256 id = _staged();
        bytes32[] memory proof = _p(L1, L2);
        vm.prank(ci);
        vm.expectRevert(ReleaseGate.AlreadySealed.selector);
        gate.writeChunk(id, _c("index.html", HTML, shaIndex, 0, INDEX, proof));
    }

    function test_rejectsPathTraversalEvenIfApproved() public {
        bytes32 bad = gate.leaf("../index.html", HTML, shaIndex, 0, sha256(INDEX));
        vm.prank(ci);
        uint256 id = gate.propose(bad, 1);
        vm.prank(m1);
        gate.approve(id, bad, 1);
        vm.prank(m2);
        gate.approve(id, bad, 1);
        bytes32[] memory none = new bytes32[](0);
        vm.prank(ci);
        vm.expectRevert(ReleaseGate.BadPath.selector);
        gate.writeChunk(id, _c("../index.html", HTML, shaIndex, 0, INDEX, none));
    }

    function test_onlyUploaderStages() public {
        vm.prank(m1);
        vm.expectRevert(ReleaseGate.NotUploader.selector);
        gate.propose(ROOT, TOTAL);
    }

    function test_uploaderCannotWriteRegistryDirectly() public {
        vm.prank(ci);
        vm.expectRevert("not editor");
        reg.putFile(container, "index.html", HTML, bytes32(0), "evil");
    }

    // ------------------------------------------------------------ approvals
    function test_approvalMustMatchRootAndChunkCount() public {
        uint256 id = _propose();
        vm.startPrank(m1);
        vm.expectRevert(ReleaseGate.WrongManifest.selector);
        gate.approve(id, keccak256("other build"), TOTAL);
        vm.expectRevert(ReleaseGate.WrongManifest.selector);
        gate.approve(id, ROOT, TOTAL - 1);
        vm.stopPrank();
    }

    // ------------------------------------------------------------ activation via the circuit
    function test_oneApprovalIsRejectedByCircuit() public {
        uint256 id = _staged();
        // rotate so earlier approvals no longer count, then approve with one maintainer only
        vm.prank(m1);
        gate.voteReplaceMaintainer(2, makeAddr("m3b"));
        vm.prank(m2);
        gate.voteReplaceMaintainer(2, makeAddr("m3b"));
        _approve(id, m1);
        vm.warp(block.timestamp + TIMELOCK);
        vm.expectRevert(abi.encodeWithSelector(ReleaseGate.PolicyRejected.selector, uint8(0x09)));
        gate.activate(id);
    }

    function test_twoApprovalsNeedTimelock() public {
        uint256 id = _staged();
        vm.expectRevert(abi.encodeWithSelector(ReleaseGate.PolicyRejected.selector, uint8(0x03)));
        gate.activate(id);

        vm.warp(block.timestamp + TIMELOCK);
        gate.activate(id);
        assertEq(gate.liveRelease(), id);
        assertEq(reg.fallbackPath(container), "index.html");
        assertEq(reg.read(container, "index.html"), gate.rootHtml(id));
    }

    function test_unanimousHotfixSkipsTimelock() public {
        uint256 id = _staged();
        _approve(id, m3);
        gate.activate(id);
        assertEq(gate.liveRelease(), id);
    }

    function test_noRollbackReplay() public {
        uint256 v1 = _staged();
        vm.warp(block.timestamp + TIMELOCK);
        gate.activate(v1);
        uint256 v2 = _staged();
        vm.warp(block.timestamp + TIMELOCK);
        gate.activate(v2);
        vm.expectRevert(ReleaseGate.NotNewer.selector);
        gate.activate(v1);
        vm.expectRevert(ReleaseGate.NotNewer.selector);
        gate.activate(v2);
    }

    function test_freezeBlocksEvenUnanimous() public {
        uint256 id = _staged();
        _approve(id, m3);
        vm.prank(m2);
        gate.freeze();
        vm.expectRevert(abi.encodeWithSelector(ReleaseGate.PolicyRejected.selector, uint8(0x17)));
        gate.activate(id);

        vm.prank(m1);
        gate.voteUnfreeze();
        vm.prank(m2);
        gate.voteUnfreeze();
        assertTrue(gate.frozen(), "needs all three");
        vm.prank(m3);
        gate.voteUnfreeze();
        assertFalse(gate.frozen());
        gate.activate(id);
    }

    function test_cancelledReleaseNeverGoesLive() public {
        uint256 id = _staged();
        _approve(id, m3);
        vm.prank(m3);
        gate.freeze();
        vm.prank(m3);
        gate.cancel(id); // the bad build is killed while frozen
        vm.prank(m1);
        gate.voteUnfreeze();
        vm.prank(m2);
        gate.voteUnfreeze();
        vm.prank(m3);
        gate.voteUnfreeze();
        assertFalse(gate.wouldAllow(id));
        vm.expectRevert(ReleaseGate.ReleaseCancelled.selector);
        gate.activate(id);
    }

    function test_cannotCancelLiveRelease() public {
        uint256 id = _staged();
        _approve(id, m3);
        gate.activate(id);
        vm.prank(m1);
        vm.expectRevert(ReleaseGate.AlreadyLive.selector);
        gate.cancel(id);
    }

    function test_outsiderCannotFreezeOrCancel() public {
        uint256 id = _propose();
        vm.expectRevert(ReleaseGate.NotMaintainer.selector);
        gate.freeze();
        vm.expectRevert(ReleaseGate.NotMaintainer.selector);
        gate.cancel(id);
    }

    // ------------------------------------------------------------ governance
    function test_twoMaintainersReplaceALostKey() public {
        address fresh = makeAddr("fresh");
        vm.prank(m1);
        gate.voteReplaceMaintainer(2, fresh);
        assertEq(gate.maintainers(2), m3, "one vote is not enough");
        vm.prank(m2);
        gate.voteReplaceMaintainer(2, fresh);
        assertEq(gate.maintainers(2), fresh);
        assertEq(gate.epoch(), 1);

        vm.prank(m3);
        vm.expectRevert(ReleaseGate.NotMaintainer.selector);
        gate.freeze();
    }

    function test_rotationVoidsEarlierApprovals() public {
        uint256 id = _staged();
        vm.prank(m1);
        gate.voteReplaceMaintainer(1, makeAddr("m2b"));
        vm.prank(m3);
        gate.voteReplaceMaintainer(1, makeAddr("m2b"));
        assertEq(gate.approvalCount(id), 0);
        assertEq(gate.policyBits(id) & 7, 0);
    }

    function test_rotationVoidsPendingVotes() public {
        vm.prank(m1);
        gate.voteSetUploader(makeAddr("newci"));
        vm.prank(m1);
        gate.voteReplaceMaintainer(2, makeAddr("m3b"));
        vm.prank(m2);
        gate.voteReplaceMaintainer(2, makeAddr("m3b"));
        vm.prank(m2);
        gate.voteSetUploader(makeAddr("newci")); // m1's vote was in the old epoch
        assertEq(gate.uploader(), ci);
    }

    function test_cannotAddExistingMaintainer() public {
        vm.prank(m1);
        vm.expectRevert(ReleaseGate.AlreadyMaintainer.selector);
        gate.voteReplaceMaintainer(2, m2);
    }

    function test_migrateNeedsAllThreeAndStopsTheGate() public {
        address next = makeAddr("nextGate");
        vm.prank(m1);
        gate.voteMigrate(next);
        vm.prank(m2);
        gate.voteMigrate(next);
        assertEq(proc.ownerOf(policyId), address(gate));
        vm.prank(m3);
        gate.voteMigrate(next);
        assertEq(proc.ownerOf(policyId), next);
        assertTrue(gate.migrated());

        vm.prank(ci);
        vm.expectRevert(ReleaseGate.SiteGone.selector);
        gate.propose(ROOT, TOTAL);
    }

    function test_rootHtmlUsesAbsolutePath() public view {
        assertEq(
            string(gate.rootHtml(12)),
            '<!doctype html><meta charset="utf-8"><title>Hashfront</title><meta http-equiv="refresh" content="0;url=/releases/v12/index.html"><a href="/releases/v12/index.html">Open release v12</a>'
        );
    }

    function testFuzz_policyBitsMatchCircuit(uint8 approvals, bool late, bool frz) public {
        uint256 id = _propose();
        _approve(id, m1);
        _approve(id, m2);
        _uploadAll(id);
        vm.prank(ci);
        gate.seal(id);
        // rotate to clear approvals, then apply the fuzzed set under the new epoch
        vm.prank(m1);
        gate.voteReplaceMaintainer(2, makeAddr("m3b"));
        vm.prank(m2);
        gate.voteReplaceMaintainer(2, makeAddr("m3b"));
        address[3] memory ms = [m1, m2, makeAddr("m3b")];
        for (uint256 i; i < 3; ++i) {
            // forge-lint: disable-next-line(incorrect-shift) -- setting bit i of a mask
            if (approvals & (1 << i) != 0) {
                vm.prank(ms[i]);
                gate.approve(id, ROOT, TOTAL);
            }
        }
        if (late) vm.warp(block.timestamp + TIMELOCK);
        if (frz) {
            vm.prank(m1);
            gate.freeze();
        }
        uint256 n = (approvals & 1) + ((approvals >> 1) & 1) + ((approvals >> 2) & 1);
        assertEq(gate.wouldAllow(id), !frz && ((late && n >= 2) || n == 3));
    }

    // ------------------------------------------------------------ alerts (TapeSend)
    function _to(uint256 n) internal pure returns (bytes32[] memory to) {
        to = new bytes32[](n);
        for (uint256 i; i < n; ++i) {
            to[i] = bytes32((uint256(196) << 160) | (0xA000 + i));
        }
    }

    function _live() internal returns (uint256 id) {
        id = _staged();
        vm.warp(block.timestamp + TIMELOCK);
        gate.activate(id);
    }

    function test_alertSendsFixedPublicMessageAsTheSite() public {
        _live();
        vm.prank(watcher);
        gate.alert(1, keccak256("evil"), _to(2)); // ALERT_MISMATCH
        assertEq(hub.sentCount(), 2);
        (address circuits, uint256 tokenId, bytes32 to,) = hub.sent(1);
        assertEq(circuits, address(proc));
        assertEq(tokenId, policyId);
        assertEq(to, _to(2)[1]);
        assertEq(hub.payloadHashAt(0), keccak256(gate.alertPayload(1, keccak256("evil"))));
    }

    function test_lastAlertRecordsTheOpenIncidentAndItsResolution() public {
        _live();
        (uint8 kind0,,,) = gate.lastAlert();
        assertEq(kind0, 0);
        vm.warp(block.timestamp + 100);
        vm.prank(watcher);
        gate.alert(1, keccak256("evil"), _to(1));
        (uint8 kind, uint64 at, uint64 release, bytes32 observed) = gate.lastAlert();
        assertEq(kind, 1);
        assertEq(at, block.timestamp);
        assertEq(release, gate.liveRelease());
        assertEq(observed, keccak256("evil"));
        vm.prank(watcher);
        gate.alert(3, keccak256("good"), _to(1));
        (kind,,,) = gate.lastAlert();
        assertEq(kind, 3);
    }

    function test_alertPayloadIsStrictTapeSendJson() public {
        _live();
        bytes32 h = 0xfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeedfeed;
        for (uint8 kind = 1; kind <= 3; ++kind) {
            bytes memory p = gate.alertPayload(kind, h);
            assertEq(
                bytes4(p[0]) | (bytes4(p[1]) >> 8) | (bytes4(p[2]) >> 16) | (bytes4(p[3]) >> 24), bytes4(0x54530200)
            );
            bytes memory content = new bytes(p.length - 4);
            for (uint256 i; i < content.length; ++i) {
                content[i] = p[i + 4];
            }
            string memory json = string(content);
            assertEq(vm.parseJsonUint(json, ".v"), 1);
            assertEq(vm.parseJsonString(json, ".kind"), "message");
            string memory body = vm.parseJsonString(json, ".body");
            assertTrue(bytes(vm.parseJsonString(json, ".subject")).length <= 200, "subject fits TAP-10");
            assertTrue(vm.indexOf(body, vm.toString(h)) != type(uint256).max, "body carries the evidence hash");
            assertEq(vm.indexOf(body, "http"), type(uint256).max, "alerts never contain links");
            assertEq(vm.indexOf(body, "://"), type(uint256).max, "alerts never contain links");
            if (kind != 2) assertTrue(vm.indexOf(body, "release v1") != type(uint256).max, "names the live release");
        }
    }

    function test_alertRejectsStrangersAndBadInput() public {
        vm.prank(makeAddr("stranger"));
        vm.expectRevert(ReleaseGate.NotMaintainer.selector);
        gate.alert(1, bytes32(0), _to(1));

        vm.startPrank(watcher);
        vm.expectRevert(ReleaseGate.BadAlert.selector);
        gate.alert(0, bytes32(0), _to(1));
        vm.expectRevert(ReleaseGate.BadAlert.selector);
        gate.alert(4, bytes32(0), _to(1));
        vm.expectRevert(ReleaseGate.BadAlert.selector);
        gate.alert(1, bytes32(0), _to(9));
        vm.stopPrank();

        vm.prank(m2); // a maintainer can alert by hand
        gate.alert(2, bytes32(0), _to(1));
        assertEq(hub.sentCount(), 1);
    }

    function test_alertEventLandsEvenIfTheHubFails() public {
        hub.setFailFor(_to(2)[0]);
        vm.expectEmit(true, false, false, true, address(gate));
        emit ReleaseGate.Alert(1, bytes32(uint256(7)), 0, 1, 1);
        vm.prank(watcher);
        gate.alert(1, bytes32(uint256(7)), _to(2));
        assertEq(hub.sentCount(), 1);
    }

    function test_alertWithoutHubOnlyEmits() public {
        ReleaseGate g = new ReleaseGate(
            ITapeOutProcessor(address(proc)),
            policyId,
            ISiteRegistry(address(reg)),
            container,
            [m1, m2, m3],
            ci,
            watcher,
            ITapeSendHub(address(0)),
            TIMELOCK
        );
        vm.expectEmit(true, false, false, true, address(g));
        emit ReleaseGate.Alert(3, bytes32(0), 0, 0, 2);
        vm.prank(watcher);
        g.alert(3, bytes32(0), _to(2));
    }

    function test_reporterRotatesWithTwoVotesAndAlertsStopAfterMigrate() public {
        address next = makeAddr("watcher2");
        vm.prank(m1);
        gate.voteSetReporter(next);
        assertEq(gate.reporter(), watcher);
        vm.prank(m3);
        gate.voteSetReporter(next);
        assertEq(gate.reporter(), next);
        vm.prank(watcher);
        vm.expectRevert(ReleaseGate.NotMaintainer.selector);
        gate.alert(1, bytes32(0), _to(1));

        for (uint256 i; i < 3; ++i) {
            vm.prank([m1, m2, m3][i]);
            gate.voteMigrate(makeAddr("nextGate"));
        }
        vm.prank(next);
        vm.expectRevert(ReleaseGate.SiteGone.selector);
        gate.alert(1, bytes32(0), _to(1));
    }

    /// A gas limit too low for the delivery must revert, not quietly emit an Alert with nothing delivered.
    function test_alertRevertsInsteadOfFailingSilentlyOnLowGas() public {
        vm.prank(watcher);
        vm.expectRevert(ReleaseGate.AlertGas.selector);
        gate.alert{gas: 300_000}(1, bytes32(0), _to(1));
    }
}
