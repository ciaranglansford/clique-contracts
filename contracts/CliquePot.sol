// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CliquePot - Round-based ETH pooling with efficient participation tracking
/// @notice Users send a fixed amount of ETH to join each round. The owner triggers payout to a random participant. The round resets after each payout.


contract CliquePot {
    address public immutable owner;
    uint256 public immutable entryAmount;
    uint256 public immutable maxParticipants;

    uint256 public currentRound;
    address[] private participants;
    mapping(address => uint256) public lastJoinedRound;

    enum RoundState { Active, PayingOut }
    RoundState public roundState;

    /// @notice Emitted when a user joins the round
    event Joined(address indexed pot, address indexed participant, uint256 round);

    /// @notice Emitted when a payout is completed
    event PayoutExecuted(uint256 round, address indexed winner, uint256 amount);

    constructor(uint256 _entryAmount, uint256 _maxParticipants) {
        require(_entryAmount > 0, "Entry amount must be > 0");
        require(_maxParticipants > 1, "Requires at least 2 participants");

        owner = msg.sender;
        entryAmount = _entryAmount;
        maxParticipants = _maxParticipants;

        currentRound = 1;
        roundState = RoundState.Active;
    }

    /// @notice Join the current round by sending exactly the required ETH
    function joinPot() external payable {
        require(roundState == RoundState.Active, "Round not active");
        require(participants.length < maxParticipants, "Round is full");
        require(msg.value == entryAmount, "Incorrect ETH amount");
        require(lastJoinedRound[msg.sender] < currentRound, "Already joined this round");

        lastJoinedRound[msg.sender] = currentRound;
        participants.push(msg.sender);

        emit Joined(address(this), msg.sender, currentRound);

    }

    /// @notice Returns true if the current pot is full
    function isPotFull() external view returns (bool) {
        return participants.length >= maxParticipants;
    }

    /// @notice Get number of participants in current round
    function getParticipantCount() external view returns (uint256) {
        return participants.length;
    }

    /// @notice Get participant address at index
    function getParticipant(uint256 index) external view returns (address) {
        require(index < participants.length, "Index out of bounds");
        return participants[index];
    }

    /// @notice Return full participant list
    function getParticipants() external view returns (address[] memory) {
        return participants;
    }

    /// @notice Owner triggers payout to random participant and resets the round
    /// NOTE: Uses insecure randomness (for MVP only)
    function triggerPayout() external {
        require(msg.sender == owner, "Only owner can trigger payout");
        require(roundState == RoundState.Active, "Payout already in progress");
        require(participants.length > 0, "No participants");

        

        uint256 winnerIndex = _selectWinnerIndex();
        address payable winner = payable(participants[winnerIndex]);
        uint256 payoutAmount = address(this).balance;

        // Safer ETH transfer
        (bool sent, ) = winner.call{value: payoutAmount}("");
        require(sent, "Transfer failed");
        roundState = RoundState.PayingOut;
        emit PayoutExecuted(currentRound, winner, payoutAmount);

        _resetRound();
    }

    /// @notice Prevent accidental ETH transfers
    receive() external payable {
        revert("Use joinPot()");
    }

    /// @dev Selects winner index using weak pseudo-randomness (MVP only)
    function _selectWinnerIndex() internal view returns (uint256) {
        return uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    address(this),
                    participants.length
                )
            )
        ) % participants.length;
    }

    /// @dev Resets round state for next game
    function _resetRound() internal {
        delete participants;
        unchecked { currentRound++; }
        roundState = RoundState.Active;
    }

    function getPotDetails() external view returns (
    address potOwner,
    uint256 entryAmt,
    uint256 maxP,
    uint256 round,
    uint256 currentCount,
    RoundState state,
    uint256 balance
) {
    return (
        owner,
        entryAmount,
        maxParticipants,
        currentRound,
        participants.length,
        roundState,
        address(this).balance
    );
}

}