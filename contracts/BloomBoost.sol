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

/**
 * @title BloomBoost
 * @notice Manages Bloom Boost social task campaigns
 * @dev Rewards scale with flower level (1x-5x multiplier)
 * 
 * Deploy on Remix:
 *   1. Compile with Solidity 0.8.20+
 *   2. Constructor args:
 *      - _bloomToken:      BLOOM token address
 *      - _usdcToken:       USDC token address  
 *      - _flowersContract: BloomFlowers address
 *      - _buybackAddress:  Address receiving USDC fees for buybacks
 */
contract BloomBoost is ReentrancyGuard, Pausable, Ownable {
    
    IERC20 public immutable bloomToken;
    IERC20 public immutable usdcToken;
    IBloomFlowers public flowersContract;
    
    address public buybackAddress;
    
    // ============ Campaign Structures ============
    
    struct Campaign {
        address creator;
        uint256 pool;
        bool payedWithBloom;
        bool active;
        uint256 participantCount;
    }
    
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    uint256 public campaignCount;
    
    // ============ Configuration ============
    
    uint256 public baseReward = 2 * 1e16; // $0.02 in 18 decimals
    uint256 public usdcFee = 2 * 1e5;     // 0.2 USDC fee (6 decimals)
    
    uint8[5] public rewardMultipliers = [1, 2, 3, 4, 5];
    
    // Creator boost config
    uint8 public creatorBoostMin = 15;
    uint8 public creatorBoostMax = 50;
    uint8 public creatorTickets = 3;
    
    // ============ Events ============
    
    event CampaignCreated(uint256 indexed id, address creator, uint256 pool, bool paidWithBloom);
    event CampaignClaimed(uint256 indexed id, address user, uint256 reward);
    event CampaignEnded(uint256 indexed id);
    event ConfigUpdated(string param);
    
    // ============ Constructor ============
    
    constructor(
        address _bloomToken,
        address _usdcToken,
        address _flowersContract,
        address _buybackAddress
    ) Ownable(msg.sender) {
        bloomToken = IERC20(_bloomToken);
        usdcToken = IERC20(_usdcToken);
        flowersContract = IBloomFlowers(_flowersContract);
        buybackAddress = _buybackAddress;
    }
    
    // ============ Campaign Functions ============
    
    function createCampaign(uint256 amount, bool payWithBloom) external nonReentrant whenNotPaused {
        require(flowersContract.hasOnboarded(msg.sender), "Not onboarded");
        require(amount > 0, "Amount must be > 0");
        
        if (payWithBloom) {
            require(bloomToken.transferFrom(msg.sender, address(this), amount), "BLOOM transfer failed");
        } else {
            uint256 totalUsdc = amount + usdcFee;
            require(usdcToken.transferFrom(msg.sender, address(this), totalUsdc), "USDC transfer failed");
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
        
        emit CampaignCreated(campaignCount, msg.sender, amount, payWithBloom);
    }
    
    function claimCampaign(uint256 campaignId) external nonReentrant whenNotPaused {
        require(flowersContract.hasOnboarded(msg.sender), "Not onboarded");
        
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.active, "Campaign not active");
        require(!hasClaimed[campaignId][msg.sender], "Already claimed");
        
        uint8 level = flowersContract.getHighestFlowerLevel(msg.sender);
        if (level == 0) level = 1;
        
        uint256 multiplier = rewardMultipliers[level - 1];
        uint256 reward = baseReward * multiplier;
        
        require(campaign.pool >= reward, "Pool exhausted");
        
        campaign.pool -= reward;
        campaign.participantCount++;
        hasClaimed[campaignId][msg.sender] = true;
        
        if (campaign.payedWithBloom) {
            require(bloomToken.transfer(msg.sender, reward), "Reward transfer failed");
        } else {
            uint256 usdcReward = reward / 1e12;
            require(usdcToken.transfer(msg.sender, usdcReward), "Reward transfer failed");
        }
        
        if (campaign.pool == 0) {
            campaign.active = false;
            emit CampaignEnded(campaignId);
        }
        
        emit CampaignClaimed(campaignId, msg.sender, reward);
    }
    
    // ============ View Functions ============
    
    function getCampaign(uint256 id) external view returns (Campaign memory) {
        return campaigns[id];
    }
    
    function getUserReward(address user) external view returns (uint256) {
        uint8 level = flowersContract.getHighestFlowerLevel(user);
        if (level == 0) level = 1;
        return baseReward * rewardMultipliers[level - 1];
    }
    
    // ============ Admin Functions ============
    
    function setFlowersContract(address _flowers) external onlyOwner {
        flowersContract = IBloomFlowers(_flowers);
        emit ConfigUpdated("flowersContract");
    }
    
    function setBaseReward(uint256 _reward) external onlyOwner {
        baseReward = _reward;
        emit ConfigUpdated("baseReward");
    }
    
    function setUsdcFee(uint256 _fee) external onlyOwner {
        usdcFee = _fee;
        emit ConfigUpdated("usdcFee");
    }
    
    function setRewardMultipliers(uint8[5] calldata _multipliers) external onlyOwner {
        rewardMultipliers = _multipliers;
        emit ConfigUpdated("rewardMultipliers");
    }
    
    function setBuybackAddress(address _buyback) external onlyOwner {
        buybackAddress = _buyback;
        emit ConfigUpdated("buybackAddress");
    }
    
    function endCampaign(uint256 campaignId) external onlyOwner {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.active, "Not active");
        campaign.active = false;
        
        // Refund remaining pool to creator
        if (campaign.pool > 0) {
            if (campaign.payedWithBloom) {
                require(bloomToken.transfer(campaign.creator, campaign.pool), "Refund failed");
            } else {
                uint256 usdcRefund = campaign.pool / 1e12;
                require(usdcToken.transfer(campaign.creator, usdcRefund), "Refund failed");
            }
            campaign.pool = 0;
        }
        
        emit CampaignEnded(campaignId);
    }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
