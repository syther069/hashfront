// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ReleaseGate} from "../src/ReleaseGate.sol";
import {ITapeOutProcessor, ISiteRegistry, ITapeSendHub} from "../src/interfaces/ITapeOut.sol";
import {MockProcessor, MockSiteRegistry} from "./mocks/Mocks.sol";

// Verifies that manifests built by the Hashfront CLI (packages/cli/scripts/gen-fixture.ts)
// are accepted by ReleaseGate: same chunk leaf encoding, same pair hashing, same proofs.
contract ManifestCompatTest is Test {
    // Field order must be alphabetical to match forge's JSON decoding.
    struct FixtureChunk {
        string contentType;
        bytes data;
        bytes32 fileSha256;
        uint256 index;
        bytes32 leaf;
        string path;
        bytes32[] proof;
    }

    ReleaseGate gate;
    MockSiteRegistry reg;
    address container = makeAddr("container");
    address ci = makeAddr("ci");
    address m1 = makeAddr("m1");
    address m2 = makeAddr("m2");
    address m3 = makeAddr("m3");

    bytes32 root;
    uint32 totalChunks;
    FixtureChunk[] chunks;

    function setUp() public {
        string memory json = vm.readFile(string.concat(vm.projectRoot(), "/test/fixtures/manifest.json"));
        root = vm.parseJsonBytes32(json, ".root");
        totalChunks = uint32(vm.parseJsonUint(json, ".totalChunks"));
        FixtureChunk[] memory parsed = abi.decode(vm.parseJson(json, ".chunks"), (FixtureChunk[]));
        for (uint256 i; i < parsed.length; ++i) {
            chunks.push(parsed[i]);
        }

        MockProcessor proc = new MockProcessor();
        reg = new MockSiteRegistry();
        string memory policy = vm.readFile(string.concat(vm.projectRoot(), "/../circuits/out/policy.json"));
        uint256 policyId = proc.tapeout(vm.parseJsonBytes(policy, ".netlist"), 5, 1);
        gate = new ReleaseGate(
            ITapeOutProcessor(address(proc)),
            policyId,
            ISiteRegistry(address(reg)),
            container,
            [m1, m2, m3],
            ci,
            ci,
            ITapeSendHub(address(0)),
            1 days
        );
        proc.safeTransferFrom(address(this), address(gate), policyId);
        reg.setEditor(container, address(gate));
    }

    function _chunk(FixtureChunk memory f) internal pure returns (ReleaseGate.Chunk memory) {
        return ReleaseGate.Chunk({
            path: f.path,
            contentType: f.contentType,
            fileSha256: f.fileSha256,
            index: f.index,
            data: f.data,
            proof: f.proof
        });
    }

    function _approved() internal returns (uint256 id) {
        vm.prank(ci);
        id = gate.propose(root, totalChunks);
        vm.prank(m1);
        gate.approve(id, root, totalChunks);
        vm.prank(m2);
        gate.approve(id, root, totalChunks);
    }

    function test_fixtureShape() public view {
        assertEq(chunks.length, totalChunks);
        assertEq(totalChunks % 2, 1, "odd leaf count exercises the unpaired-node path");
    }

    function test_leafEncodingMatches() public view {
        for (uint256 i; i < chunks.length; ++i) {
            FixtureChunk memory f = chunks[i];
            assertEq(gate.leaf(f.path, f.contentType, f.fileSha256, f.index, sha256(f.data)), f.leaf, f.path);
        }
    }

    function test_cliManifestUploadsSealsAndGoesLive() public {
        uint256 id = _approved();
        vm.startPrank(ci);
        for (uint256 i; i < chunks.length; ++i) {
            gate.writeChunk(id, _chunk(chunks[i]));
        }
        gate.seal(id);
        vm.stopPrank();

        // files reassemble to the exact bytes whose sha256 the CLI declared
        for (uint256 i; i < chunks.length; ++i) {
            FixtureChunk memory f = chunks[i];
            string memory full = string.concat("releases/v1/", f.path);
            assertEq(sha256(reg.read(container, full)), f.fileSha256, f.path);
        }

        vm.prank(m3);
        gate.approve(id, root, totalChunks);
        gate.activate(id);
        assertEq(gate.liveRelease(), id);
    }

    function test_proofForOneChunkRejectsAnother() public {
        uint256 id = _approved();
        ReleaseGate.Chunk memory c = _chunk(chunks[1]);
        c.proof = chunks[0].proof;
        vm.prank(ci);
        vm.expectRevert(ReleaseGate.BadProof.selector);
        gate.writeChunk(id, c);
    }
}
