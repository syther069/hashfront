// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// A minimal protocol vault for the HashSwap demo, used to show the optional guardian pause.
///
/// This is NOT part of the Hashfront release gate and is never deployed to mainnet by this repository. It exists to
/// show one idea: a protocol can give a single, narrow key (the guardian) the power to STOP its own contract when a
/// frontend hijack is confirmed, and only the owner can start it again.
///
/// - `pause()` can be called by the guardian only. It cannot move or withdraw funds, and it cannot unpause.
/// - `unpause()` can be called by the owner only, so resuming is always a human decision.
/// - While paused, both `deposit` and `withdraw` revert: nobody should deposit into a protocol whose frontend is
///   hijacked, and a drainer's approval cannot be used to pull funds through this vault.
contract DemoVault {
    error ZeroAddress();
    error NotGuardian();
    error NotOwner();
    error IsPaused();
    error AlreadyPaused();
    error NotPaused();
    error ZeroAmount();
    error InsufficientBalance();
    error TransferFailed();

    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);
    event PausedByGuardian(address indexed guardian);
    event Unpaused(address indexed owner);

    address public immutable owner;
    address public immutable guardian;
    bool public paused;
    mapping(address => uint256) public balanceOf;

    constructor(address owner_, address guardian_) {
        if (owner_ == address(0) || guardian_ == address(0)) revert ZeroAddress();
        owner = owner_;
        guardian = guardian_;
    }

    function deposit() external payable {
        if (paused) revert IsPaused();
        if (msg.value == 0) revert ZeroAmount();
        balanceOf[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        if (paused) revert IsPaused();
        if (amount == 0) revert ZeroAmount();
        uint256 bal = balanceOf[msg.sender];
        if (amount > bal) revert InsufficientBalance();
        // effects before the external call, so a re-entering receiver finds the balance already reduced
        balanceOf[msg.sender] = bal - amount;
        emit Withdrawn(msg.sender, amount);
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    function pause() external {
        if (msg.sender != guardian) revert NotGuardian();
        if (paused) revert AlreadyPaused();
        paused = true;
        emit PausedByGuardian(msg.sender);
    }

    function unpause() external {
        if (msg.sender != owner) revert NotOwner();
        if (!paused) revert NotPaused();
        paused = false;
        emit Unpaused(msg.sender);
    }
}
