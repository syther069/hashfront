// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {ReleaseGate} from "../../src/ReleaseGate.sol";
import {
    ITapeOutProcessor,
    ITapeOutWriter,
    ITransistors,
    IContainerOpener,
    ITapeSendHub,
    ISiteRegistry
} from "../../src/interfaces/ITapeOut.sol";

/// On a LOCAL fork of X Layer mainnet (nothing is sent to the real chain): what other TapeOut projects can reuse.
///   - the live release policy (circuit #4) is public logic: anyone can read its netlist and evaluate it;
///   - only the holder (our gate) can speak as its container;
///   - a second gate can use circuit #4 as its policy with its own site token, but then its alerts and migration fail;
///   - one alert can reach another project's TapeSend inbox next to our own, and what each extra inbox costs.
contract PolicyReuseForkTest is Test {
    ITapeOutProcessor constant PROCESSOR = ITapeOutProcessor(0x39E44DbA62811E87fDe122CA4d6c082568a384D0);
    ITapeSendHub constant HUB = ITapeSendHub(0xe61A9C7213a6Aa616C246a2B569e555B417b25ee);
    IContainerOpener constant OPENER = IContainerOpener(0x536adD8F30f03b69f6fbF29d425A816A0dC50106);
    ReleaseGate constant GATE = ReleaseGate(0xAF96CA14DB35420BF46b6Ab8feB513306B7D80F6);
    ISiteRegistry constant SITES = ISiteRegistry(0xd6EFb7adCc9c83dC4924Ad56f6a8E4e969b9ADB6);
    uint256 constant POLICY = 4;

    function setUp() public {
        vm.createSelectFork("xlayer");
    }

    function _netlist() internal view returns (bytes memory) {
        return vm.parseJsonBytes(vm.readFile(string.concat(vm.projectRoot(), "/../circuits/out/policy.json")), ".netlist");
    }

    /// bits LSB-first, as ReleaseGate.policyBits: a1 a2 a3 timelockPassed frozen
    function _spec(uint8 bits) internal pure returns (uint8) {
        uint256 approvals = (bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1);
        return (bits & 16) == 0 && (((bits & 8) != 0 && approvals >= 2) || approvals == 3) ? 1 : 0;
    }

    function test_livePolicyCircuitIsPublicLogicAnyoneCanEvaluate() public {
        assertEq(PROCESSOR.ownerOf(POLICY), address(GATE), "our gate holds circuit #4");
        assertEq(GATE.policyId(), POLICY);
        (uint32 nIn, uint32 nOut, uint32 nState, uint32 gates) = PROCESSOR.circuitInfo(POLICY);
        assertEq(nIn, 5);
        assertEq(nOut, 1);
        assertEq(nState, 0);
        assertEq(gates, 22);
        assertEq(PROCESSOR.netlist(POLICY), _netlist(), "the stored netlist is byte-identical to circuits/out/policy.json");
        address stranger = makeAddr("another-tapeout-project");
        vm.startPrank(stranger);
        for (uint8 bits; bits < 32; ++bits) {
            bytes memory out = PROCESSOR.eval(POLICY, abi.encodePacked(bits));
            assertEq(uint8(out[0]) & 1, _spec(bits), vm.toString(bits));
        }
        vm.stopPrank();
    }

    function test_onlyTheHolderSpeaksAsTheContainer() public {
        bytes32 self = HUB.endpointOf(GATE.container());
        bytes memory payload = GATE.alertPayload(1, bytes32(0));
        vm.prank(makeAddr("second-gate"));
        vm.expectRevert();
        HUB.send(address(PROCESSOR), POLICY, self, bytes32(0), payload);
    }

    function test_endpointIdIsChainIdThenContainer() public view {
        address container = GATE.container();
        bytes32 expected = bytes32((uint256(196) << 160) | uint256(uint160(container)));
        assertEq(HUB.endpointOf(container), expected, "uint32(0) | uint64(196) | container");
    }

    /// A project's own circuit and opened container (the circuit's program does not matter for the container).
    function _ownSite(address team) internal returns (uint256 id, address container) {
        vm.deal(team, 1 ether);
        bytes memory netlist = _netlist();
        uint32 gates = uint32(netlist.length / 7);
        ITransistors t = ITransistors(ITapeOutWriter(address(PROCESSOR)).transistors());
        vm.startPrank(team);
        t.mint{value: uint256(gates) * t.mintPrice() + t.protocolFee()}(0, gates);
        id = ITapeOutWriter(address(PROCESSOR)).tapeout{value: ITapeOutWriter(address(PROCESSOR)).TAPEOUT_FEE()}(netlist, 5, 1);
        container = OPENER.open{value: OPENER.FEE()}(address(PROCESSOR), id);
        vm.stopPrank();
    }

    /// A second gate that EVALUATES circuit #4 but holds its own site token: releases work, alerts and migration do not.
    function test_secondGateCanUseCircuit4AsPolicyButNotForAlertsOrMigration() public {
        address team = makeAddr("second-team");
        (uint256 siteId, address container) = _ownSite(team);
        address[3] memory m = [makeAddr("m1"), makeAddr("m2"), makeAddr("m3")];
        address watcher = makeAddr("watcher");
        vm.startPrank(team);
        ReleaseGate g = new ReleaseGate(PROCESSOR, POLICY, SITES, container, m, team, watcher, HUB, 1 hours);
        PROCESSOR.safeTransferFrom(team, address(g), siteId);
        vm.stopPrank();

        bytes memory html = "<p>v1</p>";
        bytes32 root = g.leaf("index.html", "text/html", sha256(html), 0, sha256(html));
        vm.prank(team);
        uint256 rid = g.propose(root, 1);
        for (uint256 i; i < 3; ++i) {
            vm.prank(m[i]);
            g.approve(rid, root, 1);
        }
        vm.startPrank(team);
        g.writeChunk(rid, ReleaseGate.Chunk("index.html", "text/html", sha256(html), 0, html, new bytes32[](0)));
        g.seal(rid);
        g.activate(rid); // 3 of 3 through circuit #4: allowed without the timelock
        vm.stopPrank();
        assertEq(g.liveRelease(), rid, "a release went live under circuit #4's rule");

        // the TapeSend identity is policyId (#4), which this gate does not hold: the send fails, the event still lands
        bytes32[] memory to = new bytes32[](1);
        to[0] = HUB.endpointOf(container);
        vm.expectEmit(true, false, false, true, address(g));
        emit ReleaseGate.Alert(1, bytes32(uint256(1)), rid, 0, 1);
        vm.prank(watcher);
        g.alert(1, bytes32(uint256(1)), to);

        // migration transfers token #4, which this gate does not hold
        vm.prank(m[0]);
        g.voteMigrate(makeAddr("next"));
        vm.prank(m[1]);
        g.voteMigrate(makeAddr("next"));
        vm.prank(m[2]);
        vm.expectRevert();
        g.voteMigrate(makeAddr("next"));
    }

    /// Another TapeOut project (its own circuit and opened container) subscribes its inbox to our alerts.
    function test_oneAlertReachesOurInboxAndASubscribedProjectsInbox() public {
        (, address theirs) = _ownSite(makeAddr("subscriber-team"));

        bytes32[] memory one = new bytes32[](1);
        one[0] = HUB.endpointOf(GATE.container());
        bytes32[] memory two = new bytes32[](2);
        two[0] = one[0];
        two[1] = HUB.endpointOf(theirs);
        uint256 before0 = HUB.inboxCount(two[0]);
        uint256 before1 = HUB.inboxCount(two[1]);

        address reporter = GATE.reporter();
        uint256 snap = vm.snapshotState();
        vm.prank(reporter);
        uint256 g = gasleft();
        GATE.alert(1, bytes32(uint256(1)), one);
        uint256 gasOne = g - gasleft();
        vm.revertToState(snap);

        vm.expectEmit(true, false, false, true, address(GATE));
        emit ReleaseGate.Alert(1, bytes32(uint256(1)), GATE.liveRelease(), 2, 0);
        vm.prank(reporter);
        g = gasleft();
        GATE.alert(1, bytes32(uint256(1)), two);
        uint256 gasTwo = g - gasleft();

        assertEq(HUB.inboxCount(two[0]), before0 + 1, "our own inbox");
        assertEq(HUB.inboxCount(two[1]), before1 + 1, "the subscribed project's inbox");
        console2.log("alert gas, 1 inbox:", gasOne);
        console2.log("alert gas, 2 inboxes:", gasTwo);
        console2.log("extra gas per subscribed inbox:", gasTwo - gasOne);
    }
}
