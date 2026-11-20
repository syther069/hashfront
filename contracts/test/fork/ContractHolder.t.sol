// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ITapeOutProcessor, ISiteRegistry, IContainerOpener} from "../../src/interfaces/ITapeOut.sol";

/// Minimal contract that holds a circuit NFT and edits its DeWEB site.
contract Holder {
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function put(ISiteRegistry reg, address c, string calldata path, bytes calldata data) external {
        reg.putFile(c, path, "text/html", sha256(data), data);
    }

    function fallbackTo(ISiteRegistry reg, address c, string calldata path) external {
        reg.setFallback(c, path);
    }
}

/// Day-1 check #1 on a LOCAL fork of X Layer mainnet (nothing is sent to the real chain):
/// can a smart contract be the "effective holder" and write to the real SiteRegistry?
contract ContractHolderForkTest is Test {
    ITapeOutProcessor constant LINGXI = ITapeOutProcessor(0xf70d324Da8C1C4Cb0dE3FF147E53E7E9db543c4e);
    IContainerOpener constant OPENER = IContainerOpener(0x536adD8F30f03b69f6fbF29d425A816A0dC50106);
    ISiteRegistry constant SITES = ISiteRegistry(0xd6EFb7adCc9c83dC4924Ad56f6a8E4e969b9ADB6);

    function setUp() public {
        vm.createSelectFork("xlayer");
    }

    function test_contractHolderCanEditRealSiteRegistry() public {
        address eoa = LINGXI.ownerOf(1);
        address c = OPENER.accountOf(address(LINGXI), 1);
        Holder h = new Holder();

        // before transfer: contract is not an editor
        vm.expectRevert();
        h.put(SITES, c, "hashfront-probe.html", "<p>probe</p>");

        vm.prank(eoa);
        LINGXI.safeTransferFrom(eoa, address(h), 1);
        assertEq(LINGXI.ownerOf(1), address(h));

        h.put(SITES, c, "hashfront-probe.html", "<p>probe</p>");
        (uint32 size,, bytes32 sha,,) = SITES.fileInfo(c, "hashfront-probe.html");
        assertEq(size, 12);
        assertEq(sha, sha256("<p>probe</p>"));

        h.fallbackTo(SITES, c, "hashfront-probe.html");
        assertEq(SITES.fallbackPath(c), "hashfront-probe.html");

        // the previous EOA holder lost edit rights
        vm.prank(eoa);
        vm.expectRevert();
        SITES.putFile(c, "x.html", "text/html", bytes32(0), "x");
    }
}
