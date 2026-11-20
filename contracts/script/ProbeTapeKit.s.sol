// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {console2} from "forge-std/Script.sol";
import {XLayerBase} from "./XLayerBase.s.sol";

/// Implementation plan step 3, on X Layer mainnet:
///   1. tape out the Hashfront policy circuit on the "TapeFun" processor (path B, fees in OKB);
///   2. check the live evaluator on all 32 inputs before spending anything else;
///   3. open the circuit's container (0.08 OKB) and bind its canonical .tape name;
///   4. upload probe pages: wallet connect, a deliberately bad-hash script, and a /releases/v0/ redirect.
/// The circuit NFT stays with the deployer; DeployXLayer removes the probe files and hands it to ReleaseGate.
///
/// Dry run (fork, nothing sent):  forge script script/ProbeTapeKit.s.sol --fork-url xlayer --sender <deployer>
/// Mainnet:                       forge script script/ProbeTapeKit.s.sol --rpc-url xlayer --account hashfront-deployer --broadcast
/// Resume after a partial run:     POLICY_ID=<id> forge script ...   (skips the tapeout)
contract ProbeTapeKit is XLayerBase {
    function run() external {
        vm.startBroadcast();
        address deployer = msg.sender;
        uint256 id = _policyCircuit(deployer);
        address container = _container(id);
        string memory name = _bind(id, container);
        _uploadProbes(container);
        vm.stopBroadcast();

        console2.log("POLICY_PROCESSOR=%s", PROCESSOR);
        console2.log("POLICY_ID=%s", id);
        console2.log("CONTAINER=%s", container);
        console2.log("NAME=%s", name);
        console2.log("URL=%s", _url(id));
    }

    function _uploadProbes(address container) internal {
        string memory dir = string.concat(vm.projectRoot(), "/script/probe/");
        string[6] memory paths = _probePaths();
        _put(container, paths[0], HTML, vm.readFileBinary(string.concat(dir, "wallet.html")), false);
        _put(container, paths[1], HTML, vm.readFileBinary(string.concat(dir, "badhash.html")), false);
        _put(container, paths[2], JS, vm.readFileBinary(string.concat(dir, "good.js")), false);
        _put(container, paths[3], JS, vm.readFileBinary(string.concat(dir, "bad.js")), true);
        _put(container, paths[4], HTML, vm.readFileBinary(string.concat(dir, "release.html")), false);

        bytes memory root =
            '<!doctype html><meta charset="utf-8"><title>Hashfront</title><meta http-equiv="refresh" content="0;url=/releases/v0/index.html"><a href="/releases/v0/index.html">Open release v0</a>';
        _put(container, paths[5], HTML, root, false);
        SITES.setFallback(container, "index.html");
    }

    /// @param wrongHash declare a sha256 that does not match the bytes (probe for TapeKit verification)
    function _put(address container, string memory path, string memory contentType, bytes memory data, bool wrongHash)
        internal
    {
        require(data.length <= 24_000, "probe files must fit in one chunk");
        bytes32 sha = wrongHash ? sha256(bytes.concat(data, "tampered")) : sha256(data);
        SITES.putFile(container, path, contentType, sha, data);
    }
}
