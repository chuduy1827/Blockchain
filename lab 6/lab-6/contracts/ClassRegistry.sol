// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ClassRegistry — Session 6 lab contract
/// @notice Each address may register a display name exactly once.
///         The deployer (owner) can deregister a student (e.g. a typo entry).
/// @dev    Teaching goals: state variables, mapping + array pattern,
///         custom errors, events with indexed topics, modifiers, immutable.
contract ClassRegistry {
    // ---------------------------------------------------------- errors
    error AlreadyRegistered(address who);
    error NotRegistered(address who);
    error EmptyName();
    error NotOwner();

    // ---------------------------------------------------------- events
    event Registered(address indexed who, string name);
    event Deregistered(address indexed who);

    // ---------------------------------------------------------- state
    address public immutable owner;

    mapping(address => string) private _names;
    address[] private _members;
    mapping(address => uint256) private _indexPlusOne; // 0 = absent, else index+1

    // ---------------------------------------------------------- modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ---------------------------------------------------------- writes
    function register(string calldata name) external {
        if (bytes(name).length == 0) revert EmptyName();
        if (_indexPlusOne[msg.sender] != 0) revert AlreadyRegistered(msg.sender);

        _names[msg.sender] = name;
        _members.push(msg.sender);
        _indexPlusOne[msg.sender] = _members.length;

        emit Registered(msg.sender, name);
    }

    function deregister(address who) external onlyOwner {
        uint256 idxPlusOne = _indexPlusOne[who];
        if (idxPlusOne == 0) revert NotRegistered(who);

        uint256 idx = idxPlusOne - 1;
        uint256 lastIdx = _members.length - 1;
        if (idx != lastIdx) {
            address last = _members[lastIdx];
            _members[idx] = last;
            _indexPlusOne[last] = idx + 1;
        }
        _members.pop();
        delete _indexPlusOne[who];
        delete _names[who];

        emit Deregistered(who);
    }

    // ---------------------------------------------------------- reads
    function isRegistered(address who) public view returns (bool) {
        return _indexPlusOne[who] != 0;
    }

    function nameOf(address who) external view returns (string memory) {
        if (_indexPlusOne[who] == 0) revert NotRegistered(who);
        return _names[who];
    }

    function memberCount() external view returns (uint256) {
        return _members.length;
    }

    function memberAt(uint256 index) external view returns (address who, string memory name) {
        who = _members[index];
        name = _names[who];
    }

    // ---------------------------------------------------------- HOMEWORK extra view (yêu cầu #3)
    /// @notice Homework: returns all members with their names in one call.
    /// @dev Pure view — no gas when called off-chain; useful for frontend.
    function getAllMembers() external view returns (address[] memory addrs, string[] memory names) {
        uint256 n = _members.length;
        addrs = new address[](n);
        names = new string[](n);
        for (uint256 i = 0; i < n; i++) {
            address who = _members[i];
            addrs[i] = who;
            names[i] = _names[who];
        }
    }
}
