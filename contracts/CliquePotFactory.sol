// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CliquePot.sol";

contract CliquePotFactory {
    address[] public allPots;
    mapping(address => address[]) public potsByUser;

    event PotCreated(
        address indexed potAddress,
        address indexed creator,
        uint256 entryAmount,
        uint256 maxParticipants
    );

    function createPot(uint256 entryAmount, uint256 maxParticipants) external returns (address) {
        CliquePot newPot = new CliquePot(entryAmount, maxParticipants, msg.sender);
        allPots.push(address(newPot));
        potsByUser[msg.sender].push(address(newPot));

        emit PotCreated(address(newPot), msg.sender, entryAmount, maxParticipants);
        return address(newPot);
    }

    function getAllPots() external view returns (address[] memory) {
        return allPots;
    }

    function getPotsByUser(address user) external view returns (address[] memory) {
        return potsByUser[user];
    }

    function getTotalPots() external view returns (uint256) {
        return allPots.length;
    }
}
