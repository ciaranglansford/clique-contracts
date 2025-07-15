// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CliquePot - Round-based ETH pooling with efficient participation tracking
/// @notice Users send a fixed amount of ETH to join each round. The owner triggers payout to a random participant. The round resets after each payout.

contract CliquePot {
    address public immutable owner;
    uint256 public immutable entryAmount;
    uint256 public immutable max_participants;

    uint256 public currentRound;
    address[] private participants;
    mapping(address => uint256) public lastJoinedRound;
    bool public isRoundActive;

     /// @notice Emitted when a payout is completed
    event PayoutExecuted(uint256 round, address indexed winner, uint256 amount);

    constructor(uint256 _entryAmount, uint256 _max_participants) {
        require(_entryAmount > 0, "Entry amount must be > 0");
        require(_max_participants > 1, "Requires 2 participants");
        owner = msg.sender;
        entryAmount = _entryAmount;
        max_participants = _max_participants;
        isRoundActive = true;
        currentRound = 1;
    }

    /// @notice Join the current round by sending exactly the required ETH
    function joinPot() external payable {
        require(isRoundActive, "Round not active");
        require(participants.length < max_participants, "Round is full");
        require(msg.value == entryAmount, "Incorrect ETH amount");
        require(lastJoinedRound[msg.sender] < currentRound, "Already joined this round");

        lastJoinedRound[msg.sender] = currentRound;
        participants.push(msg.sender);
    }

    /// @notice Get total number of participants in current round
    function getParticipantCount() external view returns (uint256) {
        return participants.length;
    }

    /// @notice Get participant address at given index
    function getParticipant(uint256 index) external view returns (address) {
        require(index < participants.length, "Index out of bounds");
        return participants[index];
    }

    /// @notice Owner triggers payout to random participant and resets the round
    function triggerPayout() external {
        require(msg.sender == owner, "Only owner can trigger payout");
        require(isRoundActive, "Payout already in progress");
        require(participants.length > 0, "No participants");

        isRoundActive = false;

        uint256 winnerIndex = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    address(this),
                    participants.length
                )
            )
        ) % participants.length;

        address payable winner = payable(participants[winnerIndex]);
        uint256 payoutAmount = address(this).balance;

        // Transfer the full balance to the winner
        winner.transfer(payoutAmount);

        // Emit winner event
        emit PayoutExecuted(currentRound, winner, payoutAmount);

        // Reset state for next round
        delete participants;
        currentRound++;
        isRoundActive = true;
    }

    /// @notice return a list of participants
    function getParticipants() external view returns (address[] memory) {
    return participants;
    }  

    /// @notice Prevent accidental ETH deposits
    receive() external payable {
        revert("Use joinPot()");
    }
}