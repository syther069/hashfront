// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ITapeOutProcessor, ISiteRegistry, IContainerOpener} from "../../src/interfaces/ITapeOut.sol";

/// Run: forge test --match-path test/fork/* -vv   (forks X Layer mainnet, read-only)
contract XLayerForkTest is Test {
    ITapeOutProcessor constant ONLY_TEST = ITapeOutProcessor(0x839bdD6fa7A66416A609A735e11DE5411B98574e);
    IContainerOpener constant OPENER = IContainerOpener(0x536adD8F30f03b69f6fbF29d425A816A0dC50106);
    ISiteRegistry constant SITES = ISiteRegistry(0xd6EFb7adCc9c83dC4924Ad56f6a8E4e969b9ADB6);
    address constant LINGXI_PROC = 0xf70d324Da8C1C4Cb0dE3FF147E53E7E9db543c4e;

    function setUp() public {
        vm.createSelectFork("xlayer");
    }

    function test_liveEvalThroughOurInterface() public view {
        (uint32 nIn, uint32 nOut, uint32 nState, uint32 gates) = ONLY_TEST.circuitInfo(1);
        assertEq(nIn, 2);
        assertEq(nOut, 1);
        assertEq(nState, 0);
        assertEq(gates, 4);
        uint8[4] memory xor = [0, 1, 1, 0];
        for (uint8 x; x < 4; ++x) {
            bytes memory out = ONLY_TEST.eval(1, abi.encodePacked(x));
            assertEq(uint8(out[0]) & 1, xor[x]);
        }
    }

    function test_liveSiteRegistryReads() public {
        address c = OPENER.accountOf(LINGXI_PROC, 1);
        assertTrue(OPENER.isOpened(LINGXI_PROC, 1));
        assertEq(SITES.fallbackPath(c), "index.html");
        (uint32 size, string memory ct, bytes32 sha,, uint256 chunks) = SITES.fileInfo(c, "index.html");
        assertGt(size, 0);
        assertGt(chunks, 0);
        assertTrue(sha != bytes32(0));
        emit log_named_string("lingxi index.html content-type", ct);
        emit log_named_uint("lingxi index.html size", size);
    }
}
