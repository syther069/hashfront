// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ReleaseGate} from "../src/ReleaseGate.sol";
import {ITapeOutProcessor, ISiteRegistry, ITapeSendHub} from "../src/interfaces/ITapeOut.sol";
import {MockProcessor, MockSiteRegistry} from "../test/mocks/Mocks.sol";

/// Development deployment for end-to-end tests (anvil, or anvil forking X Layer).
/// The policy circuit always runs on a MockProcessor holding the real policy netlist.
///   Env: MAINTAINERS (3 comma-separated addresses), UPLOADER, TIMELOCK (seconds)
///   Optional: REPORTER (watcher key, defaults to UPLOADER), HUB (TapeSend hub, defaults to none)
///   Optional: REGISTRY + CONTAINER to use a real SiteRegistry/container (fork mode). The caller must then
///   transfer the container's circuit NFT to the printed GATE so it becomes the site editor.
contract DeployLocal is Script {
    struct Config {
        address[3] maintainers;
        address uploader;
        address reporter;
        address hub;
        uint64 timelock;
        address realRegistry;
        address realContainer;
        bytes netlist;
    }

    function run() external {
        Config memory cfg = _config();

        vm.startBroadcast();
        MockProcessor proc = new MockProcessor();
        uint256 policyId = proc.tapeout(cfg.netlist, 5, 1);
        (ISiteRegistry registry, address container, MockSiteRegistry mock) = _site(cfg);
        ReleaseGate gate = _gate(cfg, proc, policyId, registry, container);
        proc.safeTransferFrom(msg.sender, address(gate), policyId);
        if (address(mock) != address(0)) mock.setEditor(container, address(gate));
        vm.stopBroadcast();

        console2.log("GATE=%s", address(gate));
        console2.log("REGISTRY=%s", address(registry));
        console2.log("CONTAINER=%s", container);
    }

    function _config() internal view returns (Config memory cfg) {
        address[] memory ms = vm.envAddress("MAINTAINERS", ",");
        require(ms.length == 3, "MAINTAINERS must list 3 addresses");
        cfg.maintainers = [ms[0], ms[1], ms[2]];
        cfg.uploader = vm.envAddress("UPLOADER");
        cfg.reporter = vm.envOr("REPORTER", cfg.uploader);
        cfg.hub = vm.envOr("HUB", address(0));
        cfg.timelock = uint64(vm.envUint("TIMELOCK"));
        cfg.realRegistry = vm.envOr("REGISTRY", address(0));
        if (cfg.realRegistry != address(0)) cfg.realContainer = vm.envAddress("CONTAINER");
        cfg.netlist =
            vm.parseJsonBytes(vm.readFile(string.concat(vm.projectRoot(), "/../circuits/out/policy.json")), ".netlist");
    }

    function _site(Config memory cfg)
        internal
        returns (ISiteRegistry registry, address container, MockSiteRegistry mock)
    {
        if (cfg.realRegistry != address(0)) return (ISiteRegistry(cfg.realRegistry), cfg.realContainer, mock);
        mock = new MockSiteRegistry();
        registry = ISiteRegistry(address(mock));
        container = address(uint160(uint256(keccak256("hashfront.local.container"))));
    }

    function _gate(Config memory cfg, MockProcessor proc, uint256 policyId, ISiteRegistry registry, address container)
        internal
        returns (ReleaseGate)
    {
        return new ReleaseGate(
            ITapeOutProcessor(address(proc)),
            policyId,
            registry,
            container,
            cfg.maintainers,
            cfg.uploader,
            cfg.reporter,
            ITapeSendHub(cfg.hub),
            cfg.timelock
        );
    }
}
