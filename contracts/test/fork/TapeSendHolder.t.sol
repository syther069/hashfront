// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ReleaseGate} from "../../src/ReleaseGate.sol";
import {
    ITapeOutProcessor,
    ITapeOutWriter,
    ITransistors,
    IContainerOpener,
    ISiteRegistry,
    ITapeSendHub
} from "../../src/interfaces/ITapeOut.sol";

/// On a LOCAL fork of X Layer mainnet (nothing is sent to the real chain): a ReleaseGate holding a real
/// TapeFun policy circuit sends its alert through the live DeWEB/TapeSend hub as the site's container.
contract TapeSendHolderForkTest is Test {
    ITapeSendHub constant HUB = ITapeSendHub(0xe61A9C7213a6Aa616C246a2B569e555B417b25ee);
    IContainerOpener constant OPENER = IContainerOpener(0x536adD8F30f03b69f6fbF29d425A816A0dC50106);
    ISiteRegistry constant SITES = ISiteRegistry(0xd6EFb7adCc9c83dC4924Ad56f6a8E4e969b9ADB6);
    address constant PROCESSOR = 0x39E44DbA62811E87fDe122CA4d6c082568a384D0; // "TapeFun"

    address deployer = makeAddr("hashfront-deployer");
    address watcher = makeAddr("watcher");

    function setUp() public {
        vm.createSelectFork("xlayer");
        vm.deal(deployer, 1 ether);
    }

    function test_gateAlertGoesThroughTheLiveHub() public {
        bytes memory netlist =
            vm.parseJsonBytes(vm.readFile(string.concat(vm.projectRoot(), "/../circuits/out/policy.json")), ".netlist");
        uint32 gates = uint32(netlist.length / 7);
        ITransistors t = ITransistors(ITapeOutWriter(PROCESSOR).transistors());

        vm.startPrank(deployer);
        t.mint{value: uint256(gates) * t.mintPrice() + t.protocolFee()}(0, gates);
        uint256 id = ITapeOutWriter(PROCESSOR).tapeout{value: ITapeOutWriter(PROCESSOR).TAPEOUT_FEE()}(netlist, 5, 1);
        address container = OPENER.open{value: OPENER.FEE()}(PROCESSOR, id);
        ReleaseGate gate = new ReleaseGate(
            ITapeOutProcessor(PROCESSOR),
            id,
            SITES,
            container,
            [makeAddr("m1"), makeAddr("m2"), makeAddr("m3")],
            deployer,
            watcher,
            HUB,
            1 hours
        );
        ITapeOutProcessor(PROCESSOR).safeTransferFrom(deployer, address(gate), id);
        vm.stopPrank();

        bytes32[] memory to = new bytes32[](1);
        to[0] = HUB.endpointOf(container);
        uint256 before = HUB.inboxCount(to[0]);
        vm.expectEmit(true, false, false, true, address(gate));
        emit ReleaseGate.Alert(1, bytes32(uint256(1)), 0, 1, 0);
        vm.prank(watcher);
        gate.alert(1, bytes32(uint256(1)), to);
        assertEq(HUB.inboxCount(to[0]), before + 1, "message recorded in the live hub inbox");

        // the deployer gave up the circuit, so it can no longer speak as this container
        bytes memory payload = gate.alertPayload(1, bytes32(0));
        vm.prank(deployer);
        vm.expectRevert();
        HUB.send(PROCESSOR, id, to[0], bytes32(0), payload);
    }
}
