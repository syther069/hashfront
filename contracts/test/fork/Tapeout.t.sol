// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {
    ITapeOutProcessor,
    ITapeOutWriter,
    ITransistors,
    IProcessorFactory,
    IContainerOpener,
    IDomainBinding,
    ISiteRegistry
} from "../../src/interfaces/ITapeOut.sol";

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IFactoryBem {
    function bem() external view returns (address);
}

/// Implementation plan steps 1 and 2, on a LOCAL fork of X Layer mainnet (nothing is sent to X Layer).
///   Step 1, path A: create our own "Hashfront" processor (deploy fee is paid in BEM), mint NAND, tape out.
///   Step 1, path B: tape out on an existing processor with free NAND (fees in OKB, no BEM needed).
///   Both: the live evaluator must match the policy spec on all 32 inputs.
///   Step 2: open the policy circuit's container (0.08 OKB) and bind a name.
contract TapeoutForkTest is Test {
    IProcessorFactory constant FACTORY = IProcessorFactory(0x1f09DAeFA827f02CBb40967cc91b259763760761);
    IContainerOpener constant OPENER = IContainerOpener(0x536adD8F30f03b69f6fbF29d425A816A0dC50106);
    IDomainBinding constant BINDING = IDomainBinding(0x68809Fd2fb343aA57D0aeB7f33Defe477c9666f9);
    ISiteRegistry constant SITES = ISiteRegistry(0xd6EFb7adCc9c83dC4924Ad56f6a8E4e969b9ADB6);
    /// "TapeFun", factory index 409: mintPrice 0, ~99.8k NAND left, protocolFee in OKB (Nov 19, 2026)
    address constant EXISTING_PROCESSOR = 0x39E44DbA62811E87fDe122CA4d6c082568a384D0;
    uint256 constant NAND = 0;

    address deployer = makeAddr("hashfront-deployer");
    bytes netlist;
    uint32 gates;

    function setUp() public {
        vm.createSelectFork("xlayer");
        vm.deal(deployer, 1 ether);
        string memory json = vm.readFile(string.concat(vm.projectRoot(), "/../circuits/out/policy.json"));
        netlist = vm.parseJsonBytes(json, ".netlist");
        gates = uint32(vm.parseJsonUint(json, ".gates"));
    }

    function _spec(uint8 bits) internal pure returns (uint8) {
        uint256 approvals = (bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1);
        bool allow = (bits & 16) == 0 && (((bits & 8) != 0 && approvals >= 2) || approvals == 3);
        return allow ? 1 : 0;
    }

    /// Mints exactly the NAND the policy needs on `processor`, then tapes it out. Caller must be pranked.
    function _mintAndTapeout(address processor) internal returns (uint256 policyId) {
        ITransistors t = ITransistors(ITapeOutWriter(processor).transistors());
        uint256 before = t.balanceOf(deployer, NAND);
        t.mint{value: uint256(gates) * t.mintPrice() + t.protocolFee()}(NAND, gates);
        assertEq(t.balanceOf(deployer, NAND), before + gates);

        ITapeOutWriter w = ITapeOutWriter(processor);
        policyId = w.tapeout{value: w.TAPEOUT_FEE()}(netlist, 5, 1);
        assertEq(t.balanceOf(deployer, NAND), before, "tapeout burns one NAND per gate");
        assertEq(ITapeOutProcessor(processor).ownerOf(policyId), deployer);
    }

    function _assertPolicy(address processor, uint256 id) internal view {
        ITapeOutProcessor p = ITapeOutProcessor(processor);
        (uint32 nIn, uint32 nOut, uint32 nState, uint32 gateCount) = p.circuitInfo(id);
        assertEq(nIn, 5);
        assertEq(nOut, 1);
        assertEq(nState, 0);
        assertEq(gateCount, gates);
        assertEq(p.netlist(id), netlist, "stored netlist is byte-identical");
        for (uint8 bits; bits < 32; ++bits) {
            bytes memory out = p.eval(id, abi.encodePacked(bits));
            assertEq(uint8(out[0]) & 1, _spec(bits), vm.toString(bits));
        }
    }

    function _createHashfrontProcessor() internal returns (address circuits) {
        address bem = IFactoryBem(address(FACTORY)).bem();
        uint256 fee = FACTORY.deployFee();
        deal(bem, deployer, fee); // test BEM; on mainnet the deployer must hold real BEM
        vm.startPrank(deployer);
        IERC20(bem).approve(address(FACTORY), fee);
        (, circuits) =
            FACTORY.createCPU("Hashfront", "HASHFRONT", "Release policy circuits for Hashfront", 1_000_000, 0);
        vm.stopPrank();
    }

    /// Processors created after the factory upgrade charge the transistor protocol fee in BEM
    /// (transferFrom, nonpayable mint). The tapeout fee is still paid in OKB.
    function test_step1A_ownProcessorPaidInBem() public {
        address processor = _createHashfrontProcessor();
        address bem = IFactoryBem(address(FACTORY)).bem();
        ITransistors t = ITransistors(ITapeOutWriter(processor).transistors());
        ITapeOutWriter w = ITapeOutWriter(processor);
        uint256 mintFee = uint256(gates) * t.mintPrice() + t.protocolFee();
        uint256 tapeoutFee = w.TAPEOUT_FEE();
        deal(bem, deployer, mintFee);

        vm.startPrank(deployer);
        IERC20(bem).approve(address(t), mintFee);
        t.mint(NAND, gates);
        assertEq(t.balanceOf(deployer, NAND), gates);
        uint256 id = w.tapeout{value: tapeoutFee}(netlist, 5, 1);
        vm.stopPrank();

        assertEq(t.balanceOf(deployer, NAND), 0, "tapeout burns one NAND per gate");
        _assertPolicy(processor, id);
        emit log_named_address("hashfront processor", processor);
        emit log_named_uint("BEM mint fee (8 decimals)", mintFee);
        emit log_named_uint("OKB tapeout fee (wei)", tapeoutFee);
    }

    function test_step1B_existingProcessorPaidInOkb() public {
        uint256 okbBefore = deployer.balance;
        vm.startPrank(deployer);
        uint256 id = _mintAndTapeout(EXISTING_PROCESSOR);
        vm.stopPrank();
        _assertPolicy(EXISTING_PROCESSOR, id);
        emit log_named_uint("policy circuit id", id);
        emit log_named_uint("OKB spent (wei, excl. gas)", okbBefore - deployer.balance);
    }

    function test_step2_openContainerAndBindName() public {
        vm.startPrank(deployer);
        uint256 id = _mintAndTapeout(EXISTING_PROCESSOR);
        assertFalse(OPENER.isOpened(EXISTING_PROCESSOR, id));

        address container = OPENER.open{value: OPENER.FEE()}(EXISTING_PROCESSOR, id);
        assertEq(container, OPENER.accountOf(EXISTING_PROCESSOR, id));
        assertTrue(OPENER.isOpened(EXISTING_PROCESSOR, id));

        SITES.putFile(container, "probe.html", "text/html; charset=utf-8", sha256("ok"), "ok");
        (uint32 size,,,,) = SITES.fileInfo(container, "probe.html");
        assertEq(size, 2);

        // Names are numeric canonical forms (TAP-10 §3): <#ID>.<area>.<processor>.tape. Find which form bind accepts.
        string memory id_ = vm.toString(id);
        string[4] memory candidates = [
            string.concat(id_, ".2.409.tape"),
            string.concat(id_, ".2.409"),
            string.concat(id_, ".409.tape"),
            string.concat(id_, ".409")
        ];
        uint256 fee = BINDING.monthlyFee() * 12;
        bool bound;
        for (uint256 i; i < candidates.length && !bound; ++i) {
            try BINDING.bind{value: fee}(candidates[i], container, 12) {
                bound = true;
                emit log_named_string("bind accepted", candidates[i]);
            } catch (bytes memory reason) {
                emit log_named_string("bind rejected", candidates[i]);
                emit log_named_bytes("  reason", reason);
            }
        }
        vm.stopPrank();
        assertTrue(bound, "no canonical name form accepted");
    }
}
