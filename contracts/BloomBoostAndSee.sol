// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IBloomFlowers {
    function getHighestFlowerLevel(address user) external view returns (uint8);
    function hasOnboarded(address user) external view returns (bool);
}

interface IBloomJackpot {
    function addUpgradeTickets(address user, uint8 targetLevel) external;
}

/**
 * @title BloomBoostAndSee
 * @notice Manages Bloom Boost campaigns and Bloom & See auctions
 * @dev Rewards scale with flower level (1x-5x multiplier)
 */
contract BloomBoostAndSee is ReentrancyGuard, Pausable, Ownable {
    // ============ State Variables ============
    
    IERC20 public immutable bloomToken;
    IERC20 public immutable usdcToken;
    IBloomFlowers public flowersContract;
    IBloomJackpot public jackpotContract;
    
    address public buybackAddress;
    address public protocolTreasury;
    
    // ============ Campaign Structures ============
    
    struct Campaign {
        address creator;
        uint256 pool;           // Remaining pool in BLOOM or USDC equivalent
        bool payedWithBloom;
        bool active;
        uint256 participantCount;
    }
    
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    uint256 public campaignCount;
    
    // ============ Auction Structures ============
    
    struct Auction {
        uint256 id;
        address highestBidder;
        uint256 highestBid;
        uint256 totalSupport;
        uint256 endTime;
        string link;
        bool settled;
    }
    
    struct Bid {
        address bidder;
        uint256 amount;
        uint256 supportReceived;
        string link;
    }
    
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Bid[]) public auctionBids;
    mapping(uint256 => mapping(address => uint256)) public bidIndex; // auction => bidder => index+1
    mapping(uint256 => mapping(address => uint256)) public supportGiven; // auction => supporter => amount
    
    uint256 public currentAuction;
    uint256 public constant AUCTION_DURATION = 24 hours;
    
    // Past winners
    struct Winner {
        uint256 auctionId;
        address winner;
        uint256 winningBid;
        string link;
        uint256 timestamp;
    }
    Winner[] public pastWinners;
    
    // ============ Configuration ============
    
    uint256 public baseReward = 2 * 1e16; // $0.02 in 18 decimals
    uint256 public usdcFee = 2 * 1e5;     // 0.2 USDC fee (6 decimals)
    uint256 public minBid = 10 * 1e6;     // 10 USDC minimum bid
    uint256 public minSupport = 1 * 1e6;  // 1 USDC minimum support
    uint256 public supportRequirement = 10_000_000 * 1e18; // 10M BLOOM to support
    
    // Reward multipliers by level
    uint8[5] public rewardMultipliers = [1, 2, 3, 4, 5];
    
    // Creator mining boost multipliers (1.5x to 5x stored as 15-50)
    uint8 public creatorBoostMin = 15;
    uint8 public creatorBoostMax = 50;
    uint8 public creatorTickets = 3;
    
    // ============ Events ============
    
    event CampaignCreated(uint256 indexed id, address creator, uint256 pool, bool paidWithBloom);
    event CampaignClaimed(uint256 indexed id, address user, uint256 reward);
    event CampaignEnded(uint256 indexed id);
    event BidPlaced(uint256 indexed auction, address bidder, uint256 amount);
    event BidSupported(uint256 indexed auction, address bidder, address supporter, uint256 amount);
    event AuctionSettled(uint256 indexed auction, address winner, uint256 amount);
    event ConfigUpdated(string param);
    
    // ============ Constructor ============
    
    constructor(
        address _bloomToken,
        address _usdcToken,
        address _flowersContract,
        address _jackpotContract,
        address _buybackAddress,
        address _protocolTreasury
    ) Ownable(msg.sender) {
        bloomToken = IERC20(_bloomToken);
        usdcToken = IERC20(_usdcToken);
        flowersContract = IBloomFlowers(_flowersContract);
        jackpotContract = IBloomJackpot(_jackpotContract);
        buybackAddress = _buybackAddress;
        protocolTreasury = _protocolTreasury;
        
        // Start first auction
        currentAuction = 1;
        auctions[currentAuction] = Auction({
            id: 1,
            highestBidder: address(0),
            highestBid: 0,
            totalSupport: 0,
            endTime: block.timestamp + AUCTION_DURATION,
            link: "",
            settled: false
        });
    }
    
    // ============ Campaign Functions ============
    
    /**
     * @notice Create a new Bloom Boost campaign
     * @param amount Amount of BLOOM or USDC for the pool
     * @param payWithBloom True to pay with BLOOM, false for USDC
     */
    function createCampaign(uint256 amount, bool payWithBloom) external nonReentrant whenNotPaused {
        require(flowersContract.hasOnboarded(msg.sender), "Not onboarded");
        require(amount > 0, "Amount must be > 0");
        
        if (payWithBloom) {
            require(bloomToken.transferFrom(msg.sender, address(this), amount), "BLOOM transfer failed");
        } else {
            // Charge USDC + fee
            uint256 totalUsdc = amount + usdcFee;
            require(usdcToken.transferFrom(msg.sender, address(this), totalUsdc), "USDC transfer failed");
            
            // Send fee to buyback
            require(usdcToken.transfer(buybackAddress, usdcFee), "Fee transfer failed");
        }
        
        campaignCount++;
        campaigns[campaignCount] = Campaign({
            creator: msg.sender,
            pool: amount,
            payedWithBloom: payWithBloom,
            active: true,
            participantCount: 0
        });
        
        // Creator benefits: +3 jackpot tickets
        // Mining boost would be handled off-chain or in mining contract
        
        emit CampaignCreated(campaignCount, msg.sender, amount, payWithBloom);
    }
    
    /**
     * @notice Claim reward from a campaign
     * @param campaignId The campaign to claim from
     */
    function claimCampaign(uint256 campaignId) external nonReentrant whenNotPaused {
        require(flowersContract.hasOnboarded(msg.sender), "Not onboarded");
        
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.active, "Campaign not active");
        require(!hasClaimed[campaignId][msg.sender], "Already claimed");
        
        // Calculate reward based on flower level
        uint8 level = flowersContract.getHighestFlowerLevel(msg.sender);
        if (level == 0) level = 1;
        
        uint256 multiplier = rewardMultipliers[level - 1];
        uint256 reward = baseReward * multiplier;
        
        // Check if pool has enough
        require(campaign.pool >= reward, "Pool exhausted");
        
        // Deduct from pool
        campaign.pool -= reward;
        campaign.participantCount++;
        hasClaimed[campaignId][msg.sender] = true;
        
        // Transfer reward
        if (campaign.payedWithBloom) {
            require(bloomToken.transfer(msg.sender, reward), "Reward transfer failed");
        } else {
            // Convert USDC amount (6 decimals) from reward (18 decimals)
            uint256 usdcReward = reward / 1e12;
            require(usdcToken.transfer(msg.sender, usdcReward), "Reward transfer failed");
        }
        
        // End campaign if pool is empty
        if (campaign.pool == 0) {
            campaign.active = false;
            emit CampaignEnded(campaignId);
        }
        
        emit CampaignClaimed(campaignId, msg.sender, reward);
    }
    
    // ============ Auction Functions ============
    
    /**
     * @notice Place or top up a bid
     * @param amount USDC amount to bid
     * @param link Link to feature
     */
    function placeBid(uint256 amount, string calldata link) external nonReentrant whenNotPaused {
        require(flowersContract.hasOnboarded(msg.sender), "Not onboarded");
        require(block.timestamp < auctions[currentAuction].endTime, "Auction ended");
        require(amount >= minBid, "Below minimum bid");
        
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        
        uint256 existingIndex = bidIndex[currentAuction][msg.sender];
        
        if (existingIndex > 0) {
            // Top up existing bid
            auctionBids[currentAuction][existingIndex - 1].amount += amount;
        } else {
            // New bid
            auctionBids[currentAuction].push(Bid({
                bidder: msg.sender,
                amount: amount,
                supportReceived: 0,
                link: link
            }));
            bidIndex[currentAuction][msg.sender] = auctionBids[currentAuction].length;
        }
        
        // Update highest bidder
        _updateHighestBidder();
        
        emit BidPlaced(currentAuction, msg.sender, amount);
    }
    
    /**
     * @notice Support another bidder's bid
     * @param bidder Address of bidder to support
     * @param amount USDC amount to add
     */
    function supportBid(address bidder, uint256 amount) external nonReentrant whenNotPaused {
        require(flowersContract.hasOnboarded(msg.sender), "Not onboarded");
        require(block.timestamp < auctions[currentAuction].endTime, "Auction ended");
        require(amount >= minSupport, "Below minimum support");
        require(bloomToken.balanceOf(msg.sender) >= supportRequirement, "Need 10M BLOOM to support");
        
        uint256 bidderIndex = bidIndex[currentAuction][bidder];
        require(bidderIndex > 0, "Bidder not found");
        
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        
        auctionBids[currentAuction][bidderIndex - 1].supportReceived += amount;
        supportGiven[currentAuction][msg.sender] += amount;
        auctions[currentAuction].totalSupport += amount;
        
        _updateHighestBidder();
        
        emit BidSupported(currentAuction, bidder, msg.sender, amount);
    }
    
    /**
     * @notice Update highest bidder based on bid + support
     */
    function _updateHighestBidder() internal {
        Auction storage auction = auctions[currentAuction];
        uint256 highestTotal = 0;
        address highestBidder = address(0);
        string memory highestLink = "";
        
        for (uint256 i = 0; i < auctionBids[currentAuction].length; i++) {
            Bid storage bid = auctionBids[currentAuction][i];
            uint256 total = bid.amount + bid.supportReceived;
            if (total > highestTotal) {
                highestTotal = total;
                highestBidder = bid.bidder;
                highestLink = bid.link;
            }
        }
        
        auction.highestBidder = highestBidder;
        auction.highestBid = highestTotal;
        auction.link = highestLink;
    }
    
    /**
     * @notice Settle auction and start new one
     */
    function settleAuction() external nonReentrant {
        Auction storage auction = auctions[currentAuction];
        require(block.timestamp >= auction.endTime, "Auction not ended");
        require(!auction.settled, "Already settled");
        
        auction.settled = true;
        
        // Refund losing bids
        for (uint256 i = 0; i < auctionBids[currentAuction].length; i++) {
            Bid storage bid = auctionBids[currentAuction][i];
            if (bid.bidder != auction.highestBidder) {
                // Refund bid amount (support stays with bid)
                if (bid.amount > 0) {
                    require(usdcToken.transfer(bid.bidder, bid.amount), "Refund failed");
                }
            }
        }
        
        // Record winner
        if (auction.highestBidder != address(0)) {
            pastWinners.push(Winner({
                auctionId: currentAuction,
                winner: auction.highestBidder,
                winningBid: auction.highestBid,
                link: auction.link,
                timestamp: block.timestamp
            }));
            
            // Send winning bid to protocol
            require(usdcToken.transfer(protocolTreasury, auction.highestBid), "Treasury transfer failed");
        }
        
        emit AuctionSettled(currentAuction, auction.highestBidder, auction.highestBid);
        
        // Start new auction
        currentAuction++;
        auctions[currentAuction] = Auction({
            id: currentAuction,
            highestBidder: address(0),
            highestBid: 0,
            totalSupport: 0,
            endTime: block.timestamp + AUCTION_DURATION,
            link: "",
            settled: false
        });
    }
    
    // ============ View Functions ============
    
    function getCampaign(uint256 id) external view returns (Campaign memory) {
        return campaigns[id];
    }
    
    function getAuction(uint256 id) external view returns (Auction memory) {
        return auctions[id];
    }
    
    function getAuctionBids(uint256 id) external view returns (Bid[] memory) {
        return auctionBids[id];
    }
    
    function getPastWinners() external view returns (Winner[] memory) {
        return pastWinners;
    }
    
    function getUserReward(address user) external view returns (uint256) {
        uint8 level = flowersContract.getHighestFlowerLevel(user);
        if (level == 0) level = 1;
        return baseReward * rewardMultipliers[level - 1];
    }
    
    function getTimeRemaining() external view returns (uint256) {
        if (block.timestamp >= auctions[currentAuction].endTime) {
            return 0;
        }
        return auctions[currentAuction].endTime - block.timestamp;
    }
    
    // ============ Admin Functions ============
    
    function setBaseReward(uint256 _reward) external onlyOwner {
        baseReward = _reward;
        emit ConfigUpdated("baseReward");
    }
    
    function setUsdcFee(uint256 _fee) external onlyOwner {
        usdcFee = _fee;
        emit ConfigUpdated("usdcFee");
    }
    
    function setMinBid(uint256 _min) external onlyOwner {
        minBid = _min;
        emit ConfigUpdated("minBid");
    }
    
    function setMinSupport(uint256 _min) external onlyOwner {
        minSupport = _min;
        emit ConfigUpdated("minSupport");
    }
    
    function setSupportRequirement(uint256 _requirement) external onlyOwner {
        supportRequirement = _requirement;
        emit ConfigUpdated("supportRequirement");
    }
    
    function setRewardMultipliers(uint8[5] calldata _multipliers) external onlyOwner {
        rewardMultipliers = _multipliers;
        emit ConfigUpdated("rewardMultipliers");
    }
    
    function setBuybackAddress(address _buyback) external onlyOwner {
        buybackAddress = _buyback;
        emit ConfigUpdated("buybackAddress");
    }
    
    function setProtocolTreasury(address _treasury) external onlyOwner {
        protocolTreasury = _treasury;
        emit ConfigUpdated("protocolTreasury");
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
