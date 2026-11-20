// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {console2} from "forge-std/Script.sol";
import {XLayerBase} from "./XLayerBase.s.sol";
import {ReleaseGate} from "../src/ReleaseGate.sol";
import {ITapeOutProcessor, ISiteRegistry} from "../src/interfaces/ITapeOut.sol";

/// Implementation plan steps 4 and 5: the one-shot Hashfront deployment on X Layer mainnet.
///   1. policy circuit: reuse POLICY_ID (from step 3) or tape out a new one; check all 32 inputs live;
///   2. open its container if needed and bind its canonical .tape name;
///   3. remove step 3's probe files (only the current holder can, so this must happen before step 5);
///   4. deploy ReleaseGate, check its wiring, then hand it the circuit NFT (permanent: only a 3-of-3
///      migrate can move it again) and check the gate is now the site's holder;
///   5. write the addresses to DEPLOYMENTS_FILE.
///
/// Env (required): MAINTAINERS (3 comma-separated addresses), UPLOADER, REPORTER, TIMELOCK (seconds)
/// Env (optional): POLICY_ID, DEPLOYMENTS_FILE (default deployments/rehearsal.json, so a fork run never
///                 overwrites the real file; pass deployments/xlayer.json for the mainnet run)
///
/// Rehearsal: see docs/RUNBOOK-deploy.md (local anvil fork, impersonated deployer).
/// Mainnet:   DEPLOYMENTS_FILE=deployments/xlayer.json forge script script/DeployXLayer.s.sol \
///              --rpc-url xlayer --account hashfront-deployer --broadcast
contract DeployXLayer is XLayerBase {
    struct Config {
        address[3] maintainers;
        address uploader;
        address reporter;
        uint64 timelock;
        string outFile;
    }

    function run() external {
        Config memory cfg = _config();

        vm.startBroadcast();
        address deployer = msg.sender;
        uint256 id = _policyCircuit(deployer);
        address container = _container(id);
        string memory name = _bind(id, container);
        _removeProbes(container);
        ReleaseGate gate = new ReleaseGate(
            ITapeOutProcessor(PROCESSOR),
            id,
            ISiteRegistry(address(SITES)),
            container,
            cfg.maintainers,
            cfg.uploader,
            cfg.reporter,
            HUB,
            cfg.timelock
        );
        _checkWiring(gate, id, container, cfg);
        ITapeOutProcessor(PROCESSOR).safeTransferFrom(deployer, address(gate), id);
        vm.stopBroadcast();

        require(ITapeOutProcessor(PROCESSOR).ownerOf(id) == address(gate), "gate does not hold the circuit");
        _write(cfg.outFile, address(gate), id, container, name);
        console2.log("GATE=%s", address(gate));
        console2.log("POLICY_ID=%s", id);
        console2.log("CONTAINER=%s", container);
        console2.log("ENDPOINT=%s", vm.toString(HUB.endpointOf(container)));
        console2.log("NAME=%s", name);
        console2.log("URL=%s", _url(id));
        console2.log("WROTE=%s", cfg.outFile);
    }

    function _config() internal view returns (Config memory cfg) {
        address[] memory ms = vm.envAddress("MAINTAINERS", ",");
        require(ms.length == 3, "MAINTAINERS must list 3 addresses");
        cfg.maintainers = [ms[0], ms[1], ms[2]];
        cfg.uploader = vm.envAddress("UPLOADER");
        cfg.reporter = vm.envAddress("REPORTER");
        uint256 timelock = vm.envUint("TIMELOCK");
        require(timelock > 0 && timelock <= 30 days, "TIMELOCK must be 1 s to 30 days");
        // forge-lint: disable-next-line(unsafe-typecast) -- bounded to 30 days just above
        cfg.timelock = uint64(timelock);
        cfg.outFile = vm.envOr("DEPLOYMENTS_FILE", string("deployments/rehearsal.json"));
    }

    /// Removes every probe file that exists. Missing files are skipped, so this is safe without step 3.
    function _removeProbes(address container) internal {
        string[6] memory paths = _probePaths();
        for (uint256 i; i < paths.length; ++i) {
            (uint32 size,,,, uint256 chunks) = SITES.fileInfo(container, paths[i]);
            if (size != 0 || chunks != 0) SITES.removeFile(container, paths[i]);
        }
    }

    function _checkWiring(ReleaseGate gate, uint256 id, address container, Config memory cfg) internal view {
        require(address(gate.processor()) == PROCESSOR && gate.policyId() == id, "gate policy wiring");
        require(address(gate.registry()) == address(SITES) && gate.container() == container, "gate site wiring");
        require(address(gate.hub()) == address(HUB), "gate hub wiring");
        require(gate.uploader() == cfg.uploader && gate.reporter() == cfg.reporter, "gate roles");
        require(gate.timelock() == cfg.timelock, "gate timelock");
        for (uint256 i; i < 3; ++i) {
            require(gate.maintainers(i) == cfg.maintainers[i], "gate maintainers");
        }
    }

    function _write(string memory outFile, address gate, uint256 id, address container, string memory name) internal {
        string memory k = "deployment";
        vm.serializeUint(k, "chainId", block.chainid);
        vm.serializeAddress(k, "gate", gate);
        vm.serializeAddress(k, "processor", PROCESSOR);
        vm.serializeUint(k, "policyId", id);
        vm.serializeAddress(k, "container", container);
        vm.serializeAddress(k, "siteRegistry", address(SITES));
        vm.serializeAddress(k, "tapeSendHub", address(HUB));
        vm.serializeString(k, "name", name);
        string memory json = vm.serializeString(k, "url", _url(id));
        vm.writeJson(json, string.concat(vm.projectRoot(), "/", outFile));
    }
}
