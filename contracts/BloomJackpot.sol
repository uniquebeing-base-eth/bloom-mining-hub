// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IBloomFlowers {
    function hasOnboarded(address user) external view returns (bool);
}

/**
 * @title BloomJackpot
 * @notice Weekly jackpot system with 40 winners across 7 tiers
 * @dev Tickets from invites, holdings, upgrades, and 7-day streaks
 */
contract BloomJackpot is ReentrancyGuard, Pausable, Ownable {
    // ============ State Variables ============
    
    IERC20 public immutable bloomToken;
    IBloomFlowers public flowersContract;
    
    uint256 public currentWeek;
    uint256 public weekStartTime;
    uint256 public constant WEEK_DURATION = 7 days;
    
    // Weekly tickets: week => user => ticket count
    mapping(uint256 => mapping(address => uint256)) public weeklyTickets;
    
    // All participants in a week
    mapping(uint256 => address[]) public weekParticipants;
    mapping(uint256 => mapping(address => bool)) public isParticipant;
    
    // Winners cannot win next week
    mapping(uint256 => mapping(address => bool)) public weeklyWinners;
    
    // Claim streak tracking
    mapping(address => uint256) public lastClaimDay;
    mapping(address => uint8) public claimStreak;
    
    // ============ Configuration ============
    
    // Jackpot tier distribution (40 winners total)
    // Tier: [winners, pool percentage in basis points]
    uint8[7] public tierWinners = [1, 2, 3, 5, 7, 10, 12]; // 40 total
    uint16[7] public tierPercentages = [2200, 1800, 1500, 1400, 1200, 1100, 800]; // 100% total
    
    // Ticket sources config
    uint256 public ticketsPerInvite = 1;
    uint256 public bloomPerTicket = 1_000_000 * 1e18; // 1M BLOOM = 1 ticket
    uint256 public streakTickets = 2; // 7-day streak reward
    
    // Upgrade ticket rewards: level => tickets
    mapping(uint8 => uint256) public upgradeTickets;
    
    // ============ Events ============
    
    event TicketsAdded(address indexed user, uint256 week, uint256 amount, string source);
    event TicketsClaimed(address indexed user, uint256 week, uint256 amount);
    event JackpotDrawn(uint256 indexed week, address[] winners, uint256[] prizes);
    event WeekAdvanced(uint256 newWeek, uint256 startTime);
    event ConfigUpdated(string param);
    
    // ============ Constructor ============
    
    constructor(
        address _bloomToken,
        address _flowersContract
    ) Ownable(msg.sender) {
        bloomToken = IERC20(_bloomToken);
        flowersContract = IBloomFlowers(_flowersContract);
        
        currentWeek = 1;
        weekStartTime = block.timestamp;
        
        // Initialize upgrade tickets
        upgradeTickets[2] = 20;
        upgradeTickets[3] = 30;
        upgradeTickets[4] = 40;
        upgradeTickets[5] = 50;
    }
    
    // ============ Ticket Management ============
    
    /**
     * @notice Add tickets from an invite
     */
    function addInviteTickets(address user) external {
        require(msg.sender == address(flowersContract) || msg.sender == owner(), "Unauthorized");
        _addTickets(user, ticketsPerInvite, "invite");
    }
    
    /**
     * @notice Add tickets from an upgrade attempt
     */
    function addUpgradeTickets(address user, uint8 targetLevel) external {
        require(msg.sender == address(flowersContract) || msg.sender == owner(), "Unauthorized");
        uint256 tickets = upgradeTickets[targetLevel];
        if (tickets > 0) {
            _addTickets(user, tickets, "upgrade");
        }
    }
    
    /**
     * @notice Claim tickets based on BLOOM holdings (snapshot)
     */
    function claimTickets() external nonReentrant whenNotPaused {
        require(flowersContract.hasOnboarded(msg.sender), "Not onboarded");
        
        // Can only claim during Thursday (day before draw)
        require(_isClaimWindow(), "Not claim window");
        
        uint256 balance = bloomToken.balanceOf(msg.sender);
        uint256 holdingTickets = balance / bloomPerTicket;
        
        if (holdingTickets > 0) {
            _addTickets(msg.sender, holdingTickets, "holdings");
        }
        
        // Check for 7-day streak
        uint256 today = block.timestamp / 1 days;
        if (lastClaimDay[msg.sender] == today - 1) {
            claimStreak[msg.sender]++;
        } else if (lastClaimDay[msg.sender] != today) {
            claimStreak[msg.sender] = 1;
        }
        lastClaimDay[msg.sender] = today;
        
        if (claimStreak[msg.sender] >= 7) {
            _addTickets(msg.sender, streakTickets, "streak");
            claimStreak[msg.sender] = 0; // Reset streak
        }
        
        emit TicketsClaimed(msg.sender, currentWeek, weeklyTickets[currentWeek][msg.sender]);
    }
    
    /**
     * @notice Internal function to add tickets
     */
    function _addTickets(address user, uint256 amount, string memory source) internal {
        weeklyTickets[currentWeek][user] += amount;
        
        if (!isParticipant[currentWeek][user]) {
            weekParticipants[currentWeek].push(user);
            isParticipant[currentWeek][user] = true;
        }
        
        emit TicketsAdded(user, currentWeek, amount, source);
    }
    
    // ============ Jackpot Draw ============
    
    /**
     * @notice Draw the weekly jackpot (called on Friday)
     */
    function drawJackpot() external onlyOwner nonReentrant {
        require(block.timestamp >= weekStartTime + WEEK_DURATION, "Week not ended");
        
        uint256 jackpotBalance = bloomToken.balanceOf(address(this));
        require(jackpotBalance > 0, "No jackpot funds");
        
        address[] memory participants = weekParticipants[currentWeek];
        require(participants.length > 0, "No participants");
        
        // Build weighted participant list
        uint256 totalTickets = 0;
        for (uint256 i = 0; i < participants.length; i++) {
            // Exclude previous week winners
            if (!weeklyWinners[currentWeek - 1][participants[i]]) {
                totalTickets += weeklyTickets[currentWeek][participants[i]];
            }
        }
        require(totalTickets > 0, "No valid tickets");
        
        // Draw winners for each tier
        address[] memory winners = new address[](40);
        uint256[] memory prizes = new uint256[](40);
        uint256 winnerIndex = 0;
        
        mapping(address => bool) storage selectedWinners = weeklyWinners[currentWeek];
        
        for (uint8 tier = 0; tier < 7; tier++) {
            uint256 tierPrize = (jackpotBalance * tierPercentages[tier]) / 10000;
            uint256 prizePerWinner = tierPrize / tierWinners[tier];
            
            for (uint8 w = 0; w < tierWinners[tier]; w++) {
                address winner = _selectWinner(participants, totalTickets, selectedWinners);
                if (winner != address(0)) {
                    winners[winnerIndex] = winner;
                    prizes[winnerIndex] = prizePerWinner;
                    selectedWinners[winner] = true;
                    
                    require(bloomToken.transfer(winner, prizePerWinner), "Prize transfer failed");
                    winnerIndex++;
                }
            }
        }
        
        emit JackpotDrawn(currentWeek, winners, prizes);
        
        // Advance to next week
        currentWeek++;
        weekStartTime = block.timestamp;
        
        emit WeekAdvanced(currentWeek, weekStartTime);
    }
    
    /**
     * @notice Select a random winner based on ticket weight
     */
    function _selectWinner(
        address[] memory participants,
        uint256 totalTickets,
        mapping(address => bool) storage selected
    ) internal view returns (address) {
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            totalTickets,
            participants.length
        )));
        
        uint256 target = random % totalTickets;
        uint256 cumulative = 0;
        
        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            
            // Skip already selected or previous week winners
            if (selected[participant] || weeklyWinners[currentWeek - 1][participant]) {
                continue;
            }
            
            cumulative += weeklyTickets[currentWeek][participant];
            if (cumulative > target) {
                return participant;
            }
        }
        
        return address(0);
    }
    
    // ============ View Functions ============
    
    function _isClaimWindow() public view returns (bool) {
        // Claim window is Thursday (day 4 of week)
        uint256 dayOfWeek = ((block.timestamp - weekStartTime) / 1 days) % 7;
        return dayOfWeek == 4; // Thursday
    }
    
    function getUserTickets(address user) external view returns (uint256) {
        return weeklyTickets[currentWeek][user];
    }
    
    function getJackpotBalance() external view returns (uint256) {
        return bloomToken.balanceOf(address(this));
    }
    
    function getParticipantCount() external view returns (uint256) {
        return weekParticipants[currentWeek].length;
    }
    
    function getTimeUntilDraw() external view returns (uint256) {
        if (block.timestamp >= weekStartTime + WEEK_DURATION) {
            return 0;
        }
        return (weekStartTime + WEEK_DURATION) - block.timestamp;
    }
    
    // ============ Admin Functions ============
    
    function setFlowersContract(address _flowers) external onlyOwner {
        flowersContract = IBloomFlowers(_flowers);
        emit ConfigUpdated("flowersContract");
    }
    
    function setTicketsPerInvite(uint256 _tickets) external onlyOwner {
        ticketsPerInvite = _tickets;
        emit ConfigUpdated("ticketsPerInvite");
    }
    
    function setBloomPerTicket(uint256 _amount) external onlyOwner {
        bloomPerTicket = _amount;
        emit ConfigUpdated("bloomPerTicket");
    }
    
    function setStreakTickets(uint256 _tickets) external onlyOwner {
        streakTickets = _tickets;
        emit ConfigUpdated("streakTickets");
    }
    
    function setUpgradeTickets(uint8 level, uint256 tickets) external onlyOwner {
        upgradeTickets[level] = tickets;
        emit ConfigUpdated("upgradeTickets");
    }
    
    function setTierDistribution(uint8[7] calldata _winners, uint16[7] calldata _percentages) external onlyOwner {
        tierWinners = _winners;
        tierPercentages = _percentages;
        emit ConfigUpdated("tierDistribution");
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Receive BLOOM for jackpot pool
     */
    receive() external payable {}
}
