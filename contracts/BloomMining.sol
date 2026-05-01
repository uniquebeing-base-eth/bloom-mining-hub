// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IBloomFlowers {
    struct Flower {
        uint8 level;
        bool unlocked;
        uint256 lastClaim;
    }
    
    function getUserFlowers(address user) external view returns (Flower[4] memory);
    function hasOnboarded(address user) external view returns (bool);
}

/**
 * @title BloomMining
 * @notice Handles passive BLOOM mining based on flower levels
 * @dev Unclaimed rewards after 48 hours are burned
 */
contract BloomMining is ReentrancyGuard, Pausable, Ownable {
    // ============ State Variables ============
    
    IERC20 public immutable bloomToken;
    IBloomFlowers public flowersContract;
    
    // Track last claim time per user
    mapping(address => uint256) public lastClaimTime;
    
    // ============ Configuration ============
    
    // Daily yield per level (in BLOOM tokens with 18 decimals)
    uint256[5] public dailyYields = [
        100 * 1e18,         // Level 1: 100/day
        300 * 1e18,         // Level 2: 300/day
        800 * 1e18,         // Level 3: 800/day
        1_250 * 1e18,       // Level 4: 1,250/day
        5_000 * 1e18        // Level 5: 5,000/day
    ];
    
    uint256 public constant SECONDS_PER_DAY = 86400;
    uint256 public burnTimeout = 48 hours;
    
    // ============ Events ============
    
    event MiningClaimed(address indexed user, uint256 claimed, uint256 burned);
    event ConfigUpdated(string param);
    
    // ============ Constructor ============
    
    constructor(
        address _bloomToken,
        address _flowersContract
    ) Ownable(msg.sender) {
        bloomToken = IERC20(_bloomToken);
        flowersContract = IBloomFlowers(_flowersContract);
    }
    
    // ============ Mining Functions ============
    
    /**
     * @notice Claim accumulated mining rewards
     */
    function claimMining() external nonReentrant whenNotPaused {
        require(flowersContract.hasOnboarded(msg.sender), "Not onboarded");
        
        IBloomFlowers.Flower[4] memory flowers = flowersContract.getUserFlowers(msg.sender);
        
        uint256 lastClaim = lastClaimTime[msg.sender];
        if (lastClaim == 0) {
            // First claim - use flower's lastClaim time
            for (uint8 i = 0; i < 4; i++) {
                if (flowers[i].unlocked && flowers[i].lastClaim > 0) {
                    if (lastClaim == 0 || flowers[i].lastClaim < lastClaim) {
                        lastClaim = flowers[i].lastClaim;
                    }
                }
            }
        }
        
        require(lastClaim > 0, "No mining history");
        
        uint256 elapsed = block.timestamp - lastClaim;
        uint256 totalYield = 0;
        uint256 burnedYield = 0;
        
        // Calculate yield for each unlocked flower
        for (uint8 i = 0; i < 4; i++) {
            if (flowers[i].unlocked) {
                uint8 level = flowers[i].level;
                uint256 dailyYield = dailyYields[level - 1];
                uint256 yieldPerSecond = dailyYield / SECONDS_PER_DAY;
                uint256 flowerYield = yieldPerSecond * elapsed;
                
                if (elapsed > burnTimeout) {
                    // Portion beyond 48h is burned
                    uint256 validTime = burnTimeout;
                    uint256 burnedTime = elapsed - burnTimeout;
                    
                    totalYield += yieldPerSecond * validTime;
                    burnedYield += yieldPerSecond * burnedTime;
                } else {
                    totalYield += flowerYield;
                }
            }
        }
        
        lastClaimTime[msg.sender] = block.timestamp;
        
        // Transfer claimable amount
        if (totalYield > 0) {
            require(bloomToken.transfer(msg.sender, totalYield), "Transfer failed");
        }
        
        // Burn the expired portion
        if (burnedYield > 0) {
            require(bloomToken.transfer(address(0xdead), burnedYield), "Burn failed");
        }
        
        emit MiningClaimed(msg.sender, totalYield, burnedYield);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get pending mining rewards for a user
     */
    function getPendingRewards(address user) external view returns (uint256 claimable, uint256 wouldBeBurned) {
        if (!flowersContract.hasOnboarded(user)) {
            return (0, 0);
        }
        
        IBloomFlowers.Flower[4] memory flowers = flowersContract.getUserFlowers(user);
        
        uint256 lastClaim = lastClaimTime[user];
        if (lastClaim == 0) {
            for (uint8 i = 0; i < 4; i++) {
                if (flowers[i].unlocked && flowers[i].lastClaim > 0) {
                    if (lastClaim == 0 || flowers[i].lastClaim < lastClaim) {
                        lastClaim = flowers[i].lastClaim;
                    }
                }
            }
        }
        
        if (lastClaim == 0) {
            return (0, 0);
        }
        
        uint256 elapsed = block.timestamp - lastClaim;
        
        for (uint8 i = 0; i < 4; i++) {
            if (flowers[i].unlocked) {
                uint8 level = flowers[i].level;
                uint256 dailyYield = dailyYields[level - 1];
                uint256 yieldPerSecond = dailyYield / SECONDS_PER_DAY;
                
                if (elapsed > burnTimeout) {
                    uint256 validTime = burnTimeout;
                    uint256 burnedTime = elapsed - burnTimeout;
                    
                    claimable += yieldPerSecond * validTime;
                    wouldBeBurned += yieldPerSecond * burnedTime;
                } else {
                    claimable += yieldPerSecond * elapsed;
                }
            }
        }
    }
    
    /**
     * @notice Get total daily yield for a user
     */
    function getDailyYield(address user) external view returns (uint256) {
        if (!flowersContract.hasOnboarded(user)) {
            return 0;
        }
        
        IBloomFlowers.Flower[4] memory flowers = flowersContract.getUserFlowers(user);
        uint256 total = 0;
        
        for (uint8 i = 0; i < 4; i++) {
            if (flowers[i].unlocked) {
                total += dailyYields[flowers[i].level - 1];
            }
        }
        
        return total;
    }
    
    // ============ Admin Functions ============
    
    function setFlowersContract(address _flowers) external onlyOwner {
        flowersContract = IBloomFlowers(_flowers);
        emit ConfigUpdated("flowersContract");
    }
    
    function setDailyYields(uint256[5] calldata _yields) external onlyOwner {
        dailyYields = _yields;
        emit ConfigUpdated("dailyYields");
    }
    
    function setBurnTimeout(uint256 _timeout) external onlyOwner {
        burnTimeout = _timeout;
        emit ConfigUpdated("burnTimeout");
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Withdraw BLOOM from contract (for initial funding)
     */
    function withdrawBloom(uint256 amount, address to) external onlyOwner {
        require(bloomToken.transfer(to, amount), "Transfer failed");
    }
}
