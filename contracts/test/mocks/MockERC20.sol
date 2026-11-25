// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// Minimal ERC-20 allowance behaviour for the batch-revoke end-to-end test (approve, allowance). Not a real token.
contract MockERC20 {
    mapping(address => mapping(address => uint256)) public allowance;

    event Approval(address indexed owner, address indexed spender, uint256 value);

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
}
