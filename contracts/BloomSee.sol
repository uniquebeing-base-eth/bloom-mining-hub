// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IBloomFlowers {
    function hasOnboarded(address user) external view returns (bool);
}

/**
 * @title BloomSee
 * @notice Manages Bloom & See 24-hour link auctions
 * @dev Highest bid (bid + support) wins the featured link slot
 * 
 * Deploy on Remix:
 *   1. Compile with Solidity 0.8.20+
 *   2. Constructor args:
 *      - _bloomToken:       BLOOM token address
 *      - _usdcToken:        USDC token address
 *      - _flowersContract:  BloomFlowers address
 *      - _protocolTreasury: Address receiving winning bids
 */
contract BloomSee is ReentrancyGuard, Pausable, Ownable {
    
    IERC20 public immutable bloomToken;
    IERC20 public immutable usdcToken;
    IBloomFlowers public flowersContract;
    
    address public protocolTreasury;
    
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
    mapping(uint256 => mapping(address => uint256)) public bidIndex;
    mapping(uint256 => mapping(address => uint256)) public supportGiven;
    
    uint256 public currentAuction;
    uint256 public constant AUCTION_DURATION = 24 hours;
    
    struct Winner {
        uint256 auctionId;
        address winner;
        uint256 winningBid;
        string link;
        uint256 timestamp;
    }
    Winner[] public pastWinners;
    
    // ============ Configuration ============
    
    uint256 public minBid = 10 * 1e6;      // 10 USDC
    uint256 public minSupport = 1 * 1e6;    // 1 USDC
    uint256 public supportRequirement = 10_000_000 * 1e18; // 10M BLOOM to support
    
    // ============ Events ============
    
    event BidPlaced(uint256 indexed auction, address bidder, uint256 amount);
    event BidSupported(uint256 indexed auction, address bidder, address supporter, uint256 amount);
    event AuctionSettled(uint256 indexed auction, address winner, uint256 amount);
    event ConfigUpdated(string param);
    
    // ============ Constructor ============
    
    constructor(
        address _bloomToken,
        address _usdcToken,
        address _flowersContract,
        address _protocolTreasury
    ) Ownable(msg.sender) {
        bloomToken = IERC20(_bloomToken);
        usdcToken = IERC20(_usdcToken);
        flowersContract = IBloomFlowers(_flowersContract);
        protocolTreasury = _protocolTreasury;
        
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
    
    // ============ Auction Functions ============
    
    function placeBid(uint256 amount, string calldata link) external nonReentrant whenNotPaused {
        require(flowersContract.hasOnboarded(msg.sender), "Not onboarded");
        require(block.timestamp < auctions[currentAuction].endTime, "Auction ended");
        require(amount >= minBid, "Below minimum bid");
        
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        
        uint256 existingIndex = bidIndex[currentAuction][msg.sender];
        
        if (existingIndex > 0) {
            auctionBids[currentAuction][existingIndex - 1].amount += amount;
        } else {
            auctionBids[currentAuction].push(Bid({
                bidder: msg.sender,
                amount: amount,
                supportReceived: 0,
                link: link
            }));
            bidIndex[currentAuction][msg.sender] = auctionBids[currentAuction].length;
        }
        
        _updateHighestBidder();
        emit BidPlaced(currentAuction, msg.sender, amount);
    }
    
    function supportBid(address bidder, uint256 amount) external nonReentrant whenNotPaused {
        require(flowersContract.hasOnboarded(msg.sender), "Not onboarded");
        require(block.timestamp < auctions[currentAuction].endTime, "Auction ended");
        require(amount >= minSupport, "Below minimum support");
        require(bloomToken.balanceOf(msg.sender) >= supportRequirement, "Need 10M BLOOM to support");
        
        uint256 bidderIdx = bidIndex[currentAuction][bidder];
        require(bidderIdx > 0, "Bidder not found");
        
        require(usdcToken.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        
        auctionBids[currentAuction][bidderIdx - 1].supportReceived += amount;
        supportGiven[currentAuction][msg.sender] += amount;
        auctions[currentAuction].totalSupport += amount;
        
        _updateHighestBidder();
        emit BidSupported(currentAuction, bidder, msg.sender, amount);
    }
    
    function _updateHighestBidder() internal {
        Auction storage auction = auctions[currentAuction];
        uint256 highestTotal = 0;
        address highBidder = address(0);
        string memory highLink = "";
        
        for (uint256 i = 0; i < auctionBids[currentAuction].length; i++) {
            Bid storage bid = auctionBids[currentAuction][i];
            uint256 total = bid.amount + bid.supportReceived;
            if (total > highestTotal) {
                highestTotal = total;
                highBidder = bid.bidder;
                highLink = bid.link;
            }
        }
        
        auction.highestBidder = highBidder;
        auction.highestBid = highestTotal;
        auction.link = highLink;
    }
    
    function settleAuction() external nonReentrant {
        Auction storage auction = auctions[currentAuction];
        require(block.timestamp >= auction.endTime, "Auction not ended");
        require(!auction.settled, "Already settled");
        
        auction.settled = true;
        
        // Refund losing bids
        for (uint256 i = 0; i < auctionBids[currentAuction].length; i++) {
            Bid storage bid = auctionBids[currentAuction][i];
            if (bid.bidder != auction.highestBidder && bid.amount > 0) {
                require(usdcToken.transfer(bid.bidder, bid.amount), "Refund failed");
            }
        }
        
        // Send winning bid to protocol treasury
        if (auction.highestBidder != address(0)) {
            pastWinners.push(Winner({
                auctionId: currentAuction,
                winner: auction.highestBidder,
                winningBid: auction.highestBid,
                link: auction.link,
                timestamp: block.timestamp
            }));
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
    
    function getAuction(uint256 id) external view returns (Auction memory) {
        return auctions[id];
    }
    
    function getAuctionBids(uint256 id) external view returns (Bid[] memory) {
        return auctionBids[id];
    }
    
    function getPastWinners() external view returns (Winner[] memory) {
        return pastWinners;
    }
    
    function getTimeRemaining() external view returns (uint256) {
        if (block.timestamp >= auctions[currentAuction].endTime) return 0;
        return auctions[currentAuction].endTime - block.timestamp;
    }
    
    // ============ Admin Functions ============
    
    function setFlowersContract(address _flowers) external onlyOwner {
        flowersContract = IBloomFlowers(_flowers);
        emit ConfigUpdated("flowersContract");
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
    
    function setProtocolTreasury(address _treasury) external onlyOwner {
        protocolTreasury = _treasury;
        emit ConfigUpdated("protocolTreasury");
    }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
