// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {DemoVault} from "../src/DemoVault.sol";

/// Tries to re-enter withdraw() from its receive hook.
contract Reentrant {
    DemoVault public immutable vault;
    uint256 public reentered;

    constructor(DemoVault v) {
        vault = v;
    }

    function fund() external payable {
        vault.deposit{value: msg.value}();
    }

    function attack(uint256 amount) external {
        vault.withdraw(amount);
    }

    receive() external payable {
        reentered++;
        if (address(vault).balance >= 1 ether) {
            try vault.withdraw(1 ether) {} catch {}
        }
    }
}

contract DemoVaultTest is Test {
    DemoVault vault;
    address owner = address(0xA11CE);
    address guardian = address(0x60A2D);
    address alice = address(0xA1);
    address bob = address(0xB0B);

    function setUp() public {
        vault = new DemoVault(owner, guardian);
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }

    function test_deposit_and_withdraw_work_while_not_paused() public {
        vm.prank(alice);
        vault.deposit{value: 3 ether}();
        assertEq(vault.balanceOf(alice), 3 ether);
        vm.prank(alice);
        vault.withdraw(1 ether);
        assertEq(vault.balanceOf(alice), 2 ether);
        assertEq(alice.balance, 98 ether);
    }

    function test_guardian_pause_blocks_withdraw_and_deposit() public {
        vm.prank(alice);
        vault.deposit{value: 3 ether}();
        vm.prank(guardian);
        vault.pause();
        assertTrue(vault.paused());

        vm.prank(alice);
        vm.expectRevert(DemoVault.IsPaused.selector);
        vault.withdraw(1 ether);
        vm.prank(bob);
        vm.expectRevert(DemoVault.IsPaused.selector);
        vault.deposit{value: 1 ether}();
        assertEq(vault.balanceOf(alice), 3 ether, "funds stay where they are");
    }

    function test_only_the_guardian_can_pause() public {
        for (uint160 i = 0; i < 3; i++) {
            address who = i == 0 ? owner : i == 1 ? alice : address(0xDEAD);
            vm.prank(who);
            vm.expectRevert(DemoVault.NotGuardian.selector);
            vault.pause();
        }
        assertFalse(vault.paused());
    }

    function test_pausing_twice_reverts_so_a_second_incident_call_is_visible() public {
        vm.startPrank(guardian);
        vault.pause();
        vm.expectRevert(DemoVault.AlreadyPaused.selector);
        vault.pause();
        vm.stopPrank();
    }

    function test_only_the_owner_can_unpause_never_the_guardian() public {
        vm.prank(guardian);
        vault.pause();

        vm.prank(guardian);
        vm.expectRevert(DemoVault.NotOwner.selector);
        vault.unpause();
        vm.prank(alice);
        vm.expectRevert(DemoVault.NotOwner.selector);
        vault.unpause();

        vm.prank(owner);
        vault.unpause();
        assertFalse(vault.paused());

        vm.prank(alice);
        vault.deposit{value: 1 ether}();
        assertEq(vault.balanceOf(alice), 1 ether);
    }

    function test_unpause_when_not_paused_reverts() public {
        vm.prank(owner);
        vm.expectRevert(DemoVault.NotPaused.selector);
        vault.unpause();
    }

    function test_input_checks() public {
        vm.expectRevert(DemoVault.ZeroAddress.selector);
        new DemoVault(address(0), guardian);
        vm.expectRevert(DemoVault.ZeroAddress.selector);
        new DemoVault(owner, address(0));
        vm.prank(alice);
        vm.expectRevert(DemoVault.ZeroAmount.selector);
        vault.deposit();
        vm.prank(alice);
        vm.expectRevert(DemoVault.ZeroAmount.selector);
        vault.withdraw(0);
        vm.prank(alice);
        vm.expectRevert(DemoVault.InsufficientBalance.selector);
        vault.withdraw(1);
    }

    function test_withdraw_cannot_be_reentered() public {
        Reentrant r = new Reentrant(vault);
        vm.deal(address(r), 2 ether);
        vm.prank(bob);
        vault.deposit{value: 5 ether}(); // other people's funds sit in the vault
        r.fund{value: 1 ether}();
        r.attack(1 ether);
        assertEq(vault.balanceOf(address(r)), 0);
        assertEq(address(vault).balance, 5 ether, "only the attacker's own 1 ether left");
    }

    function testFuzz_balances_add_up(uint96 a, uint96 b, uint96 w) public {
        a = uint96(bound(a, 1, 50 ether));
        b = uint96(bound(b, 1, 50 ether));
        vm.prank(alice);
        vault.deposit{value: a}();
        vm.prank(bob);
        vault.deposit{value: b}();
        w = uint96(bound(w, 1, a));
        vm.prank(alice);
        vault.withdraw(w);
        assertEq(vault.balanceOf(alice) + vault.balanceOf(bob), address(vault).balance);
    }
}
