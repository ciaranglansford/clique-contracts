// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Minimal interface to interact with MasterChef staking contract
interface IMasterChef {
    function deposit(uint256 pid, uint256 amount) external payable;
    function withdraw(uint256 pid, uint256 amount) external;
    function harvest(uint256 pid) external;
}

/// @title CliquePot - Round-based ETH pooling with staking integration
/// @notice Users send a fixed amount of ETH to join each round. ETH is staked in MasterChef. Owner triggers payout and winner receives ETH + rewards.
contract CliquePot is ReentrancyGuard {
    address public owner;
    uint256 public immutable entryAmount;
    uint256 public immutable maxParticipants;

    uint256 public currentRound;
    address[] private participants;
    mapping(address => uint256) public lastJoinedRound;

    enum RoundState { Active, PayingOut }
    RoundState public roundState;

    // Hardcoded staking target for testing
    IMasterChef public constant masterChef = IMasterChef(0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512); // replace with actual deployed address
    uint256 public constant chefPid = 0;

    event Joined(address indexed pot, address indexed participant, uint256 round);
    event PayoutExecuted(uint256 round, address indexed winner, uint256 amount);

    constructor(
        uint256 _entryAmount,
        uint256 _maxParticipants,
        address _owner
    ) {
        require(_entryAmount > 0, "Entry amount must be > 0");
        require(_maxParticipants > 1, "Requires at least 2 participants");

        owner = _owner;
        entryAmount = _entryAmount;
        maxParticipants = _maxParticipants;

        currentRound = 1;
        roundState = RoundState.Active;
    }

    function joinPot() external payable {
        require(roundState == RoundState.Active, "Round not active");
        require(participants.length < maxParticipants, "Round is full");
        require(msg.value == entryAmount, "Incorrect ETH amount");
        require(lastJoinedRound[msg.sender] < currentRound, "Already joined this round");

        lastJoinedRound[msg.sender] = currentRound;
        participants.push(msg.sender);

        // Stake ETH directly into MasterChef
        masterChef.deposit{value: msg.value}(chefPid, 0);

        emit Joined(address(this), msg.sender, currentRound);
    }

    function isPotFull() external view returns (bool) {
        return participants.length >= maxParticipants;
    }

    function getParticipantCount() external view returns (uint256) {
        return participants.length;
    }

    function getParticipant(uint256 index) external view returns (address) {
        require(index < participants.length, "Index out of bounds");
        return participants[index];
    }

    function getParticipants() external view returns (address[] memory) {
        return participants;
    }

    function triggerPayout() external nonReentrant {
        require(msg.sender == owner, "Only owner can trigger payout");
        require(roundState == RoundState.Active, "Payout already in progress");
        require(participants.length > 0, "No participants");

        roundState = RoundState.PayingOut;

        // Harvest rewards from MasterChef
        masterChef.harvest(chefPid);

        // Withdraw total staked ETH
        uint256 totalStaked = entryAmount * participants.length;
        masterChef.withdraw(chefPid, totalStaked);

        // Select winner and send payout
        uint256 winnerIndex = _selectWinnerIndex();
        address payable winner = payable(participants[winnerIndex]);
        uint256 payoutAmount = address(this).balance;

        (bool sent, ) = winner.call{value: payoutAmount}("");
        require(sent, "Transfer failed");

        emit PayoutExecuted(currentRound, winner, payoutAmount);

        _resetRound();
    }

    receive() external payable {}

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

    function _resetRound() internal {
        delete participants;
        unchecked {
            currentRound++;
        }
        roundState = RoundState.Active;
    }

    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Not owner");
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
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
