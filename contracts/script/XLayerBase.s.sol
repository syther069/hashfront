// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {
    ITapeOutProcessor,
    ITapeOutWriter,
    ITransistors,
    IProcessorFactory,
    IContainerOpener,
    IDomainBinding,
    ISiteRegistry,
    ITapeSendHub
} from "../src/interfaces/ITapeOut.sol";

/// Shared X Layer mainnet addresses and steps for ProbeTapeKit (plan step 3) and DeployXLayer (steps 4 and 5).
/// Every step is idempotent, so a run that stopped halfway can be resumed with POLICY_ID=<id>.
abstract contract XLayerBase is Script {
    IProcessorFactory constant FACTORY = IProcessorFactory(0x1f09DAeFA827f02CBb40967cc91b259763760761);
    IContainerOpener constant OPENER = IContainerOpener(0x536adD8F30f03b69f6fbF29d425A816A0dC50106);
    IDomainBinding constant BINDING = IDomainBinding(0x68809Fd2fb343aA57D0aeB7f33Defe477c9666f9);
    ISiteRegistry constant SITES = ISiteRegistry(0xd6EFb7adCc9c83dC4924Ad56f6a8E4e969b9ADB6);
    ITapeSendHub constant HUB = ITapeSendHub(0xe61A9C7213a6Aa616C246a2B569e555B417b25ee);
    address constant PROCESSOR = 0x39E44DbA62811E87fDe122CA4d6c082568a384D0; // "TapeFun"
    uint256 constant PROCESSOR_NUMBER = 409; // factory index; used in the canonical name
    uint256 constant NAND = 0;
    string constant HTML = "text/html; charset=utf-8";
    string constant JS = "text/javascript; charset=utf-8";

    /// Files ProbeTapeKit uploads; DeployXLayer removes them before handing the site to the gate.
    function _probePaths() internal pure returns (string[6] memory) {
        return [
            "probe/wallet.html",
            "probe/badhash.html",
            "probe/good.js",
            "probe/bad.js",
            "releases/v0/index.html",
            "index.html"
        ];
    }

    function _policyNetlist() internal view returns (bytes memory netlist, uint32 gates) {
        string memory policy = vm.readFile(string.concat(vm.projectRoot(), "/../circuits/out/policy.json"));
        netlist = vm.parseJsonBytes(policy, ".netlist");
        gates = uint32(vm.parseJsonUint(policy, ".gates"));
    }

    /// Tapes out the policy unless POLICY_ID names an existing circuit, then checks it before anything else is spent.
    /// Must run inside a broadcast.
    function _policyCircuit(address deployer) internal returns (uint256 id) {
        require(FACTORY.cpuAt(PROCESSOR_NUMBER) == PROCESSOR, "processor number mismatch");
        (bytes memory netlist, uint32 gates) = _policyNetlist();
        id = vm.envOr("POLICY_ID", uint256(0));
        if (id == 0) {
            ITransistors t = ITransistors(ITapeOutWriter(PROCESSOR).transistors());
            require(t.supplyCap() - t.minted() >= gates, "processor has too few transistors left");
            t.mint{value: uint256(gates) * t.mintPrice() + t.protocolFee()}(NAND, gates);
            id = ITapeOutWriter(PROCESSOR).tapeout{value: ITapeOutWriter(PROCESSOR).TAPEOUT_FEE()}(netlist, 5, 1);
        }
        require(ITapeOutProcessor(PROCESSOR).ownerOf(id) == deployer, "deployer does not hold the policy circuit");
        _checkPolicy(id, netlist);
    }

    /// Aborts if the stored circuit is not byte-identical to our policy or its live evaluator differs from the spec.
    function _checkPolicy(uint256 id, bytes memory netlist) internal view {
        ITapeOutProcessor p = ITapeOutProcessor(PROCESSOR);
        require(keccak256(p.netlist(id)) == keccak256(netlist), "stored netlist differs");
        for (uint8 bits; bits < 32; ++bits) {
            uint256 approvals = (bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1);
            bool expected = (bits & 16) == 0 && (((bits & 8) != 0 && approvals >= 2) || approvals == 3);
            bytes memory out = p.eval(id, abi.encodePacked(bits));
            require((uint8(out[0]) & 1) == (expected ? 1 : 0), "live eval differs from the policy spec");
        }
    }

    /// Opens the container (0.08 OKB) only if it is not open yet. Must run inside a broadcast.
    function _container(uint256 id) internal returns (address) {
        if (OPENER.isOpened(PROCESSOR, id)) return OPENER.accountOf(PROCESSOR, id);
        return OPENER.open{value: OPENER.FEE()}(PROCESSOR, id);
    }

    /// Binds the canonical `<id>.2.409.tape` name for 12 months (free on X Layer). Must run inside a broadcast.
    function _bind(uint256 id, address container) internal returns (string memory name) {
        name = _name(id);
        BINDING.bind{value: BINDING.monthlyFee() * 12}(name, container, 12);
    }

    function _name(uint256 id) internal pure returns (string memory) {
        return string.concat(vm.toString(id), ".2.", vm.toString(PROCESSOR_NUMBER), ".tape");
    }

    function _url(uint256 id) internal pure returns (string memory) {
        return string.concat("https://", vm.toString(id), "-2-", vm.toString(PROCESSOR_NUMBER), ".tapekit.org/");
    }
}
