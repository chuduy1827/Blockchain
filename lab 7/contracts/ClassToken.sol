// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/// @title ClassToken
/// @notice A capped ERC-20 with EIP-2612 gasless approvals.
contract ClassToken is ERC20, ERC20Capped, ERC20Permit {
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10 ** 18;

    constructor(address initialHolder)
        ERC20("ClassToken", "CTK")
        ERC20Capped(MAX_SUPPLY)
        ERC20Permit("ClassToken")
    {
        _mint(initialHolder, MAX_SUPPLY);
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped)
    {
        super._update(from, to, value);
    }
}
