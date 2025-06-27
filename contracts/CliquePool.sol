// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CliquePool - A simple Ether pooling contract for the Clique MVP
/// @author 
/// @notice Users can deposit ETH, and the contract owner can trigger a payout to a random participant
contract CliquePool {
    address public immutable owner; // Deployer/owner of the contract
    address[] public participants; // Dynamic array to store wallet address that deposit to pool
    bool public isPayoutDone; // Ensures payout can only happen once per pool instance

    /// @notice Sets the deploy as the contract owner
    constructor(){
        owner = msg.sender;
    }

    /// @notice Anyone can send Ether to join the pool
    /// @dev 'msg.sender' is the wallet calling the function, 'msg.value' is the ETH they send
    function joinPool() external payable {
        require(msg.value > 0, "Must send ETH to join");
        participants.push(msg.sender); //Record the sender's address
    }

    /// @notice Get the total number of participants
    function getParticipantCount() external view returns(uint256){
        return participants.length;
    }

    /// @notice Only the owner can trigger payout
    /// @dev Payout sends the entire balance to one randomly selected participant
    function triggerPayout() external {
        require(msg.sender == owner, "Only owner can trigger payout");
        require(participants.length > 0, "No participants to pay out");
        require(!isPayoutDone, "Payout already completed");

        //insecure randomness for testing
        uint256 randomIndex = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, participants.length)
            )
        ) % participants.length;

        address payable winner = payable(participants[randomIndex]);
        isPayoutDone = true;

        // Transfer the entire balance to the winner
        winner.transfer(address(this).balance);
    }

      /// @notice Fallback to receive ETH directly
    receive() external payable {
        participants.push(msg.sender); // If someone sends ETH directly, count them in
    }
}