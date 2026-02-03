// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BloomFlowers
 * @notice Manages flower unlocking and upgrading for Bloom Protocol
 * @dev Each user has 4 flowers that can be upgraded from Level 1 to 5
 */
contract BloomFlowers is ReentrancyGuard, Pausable, Ownable {
    // ============ State Variables ============
    
    IERC20 public immutable bloomToken;
    address public jackpotContract;
    address public protocolTreasury;
    
    struct Flower {
        uint8 level;        // 1-5
        bool unlocked;      // true if flower is active
        uint256 lastClaim;  // timestamp for mining
    }
    
    // User address => Array of 4 flowers
    mapping(address => Flower[4]) public userFlowers;
    mapping(address => bool) public hasOnboarded;
    
    // Invite codes
    mapping(bytes32 => bool) public validInviteCodes;
    mapping(bytes32 => address) public inviteCodeOwner;
    mapping(address => bytes32) public userInviteCode;
    
    // ============ Configuration ============
    
    uint256 public unlockCost = 100_000 * 1e18; // 100,000 BLOOM
    
    // Upgrade costs per level (1->2, 2->3, 3->4, 4->5)
    uint256[4] public upgradeCosts = [
        10_000_000 * 1e18,   // Level 2: 10M
        30_000_000 * 1e18,   // Level 3: 30M
        100_000_000 * 1e18,  // Level 4: 100M
        200_000_000 * 1e18   // Level 5: 200M
    ];
    
    // Success rates in basis points (10000 = 100%)
    uint16[4] public successRates = [
        9000,  // Level 2: 90%
        6000,  // Level 3: 60%
        3000,  // Level 4: 30%
        1500   // Level 5: 15%
    ];
    
    // ============ Events ============
    
    event UserOnboarded(address indexed user, bytes32 inviteCode);
    event FlowerUnlocked(address indexed user, uint8 flowerIndex, uint256 toProtocol, uint256 toJackpot);
    event FlowerUpgraded(address indexed user, uint8 flowerIndex, uint8 newLevel, bool success, uint256 burned, uint256 toJackpot, uint256 toProtocol);
    event InviteCodeCreated(address indexed user, bytes32 inviteCode);
    event ConfigUpdated(string param);
    
    // ============ Constructor ============
    
    constructor(
        address _bloomToken,
        address _jackpotContract,
        address _protocolTreasury
    ) Ownable(msg.sender) {
        bloomToken = IERC20(_bloomToken);
        jackpotContract = _jackpotContract;
        protocolTreasury = _protocolTreasury;
    }
    
    // ============ Onboarding ============
    
    /**
     * @notice Onboard a new user with an invite code
     * @param inviteCode The invite code to use
     */
    function onboard(bytes32 inviteCode) external nonReentrant whenNotPaused {
        require(!hasOnboarded[msg.sender], "Already onboarded");
        require(validInviteCodes[inviteCode], "Invalid invite code");
        
        hasOnboarded[msg.sender] = true;
        
        // Initialize 4 flowers: first unlocked, rest locked
        userFlowers[msg.sender][0] = Flower({
            level: 1,
            unlocked: true,
            lastClaim: block.timestamp
        });
        
        for (uint8 i = 1; i < 4; i++) {
            userFlowers[msg.sender][i] = Flower({
                level: 1,
                unlocked: false,
                lastClaim: 0
            });
        }
        
        // Generate invite code for new user
        bytes32 newCode = keccak256(abi.encodePacked(msg.sender, block.timestamp));
        validInviteCodes[newCode] = true;
        inviteCodeOwner[newCode] = msg.sender;
        userInviteCode[msg.sender] = newCode;
        
        emit UserOnboarded(msg.sender, inviteCode);
        emit InviteCodeCreated(msg.sender, newCode);
    }
    
    // ============ Flower Management ============
    
    /**
     * @notice Unlock a locked flower
     * @param flowerIndex Index of the flower to unlock (1-3)
     */
    function unlockFlower(uint8 flowerIndex) external nonReentrant whenNotPaused {
        require(hasOnboarded[msg.sender], "Not onboarded");
        require(flowerIndex >= 1 && flowerIndex <= 3, "Invalid flower index");
        require(!userFlowers[msg.sender][flowerIndex].unlocked, "Already unlocked");
        
        // Transfer BLOOM from user
        require(bloomToken.transferFrom(msg.sender, address(this), unlockCost), "Transfer failed");
        
        // 50% to protocol, 50% to jackpot
        uint256 toProtocol = unlockCost / 2;
        uint256 toJackpot = unlockCost - toProtocol;
        
        require(bloomToken.transfer(protocolTreasury, toProtocol), "Protocol transfer failed");
        require(bloomToken.transfer(jackpotContract, toJackpot), "Jackpot transfer failed");
        
        // Unlock the flower
        userFlowers[msg.sender][flowerIndex].unlocked = true;
        userFlowers[msg.sender][flowerIndex].level = 1;
        userFlowers[msg.sender][flowerIndex].lastClaim = block.timestamp;
        
        emit FlowerUnlocked(msg.sender, flowerIndex, toProtocol, toJackpot);
    }
    
    /**
     * @notice Upgrade a flower to the next level
     * @param flowerIndex Index of the flower to upgrade (0-3)
     */
    function upgradeFlower(uint8 flowerIndex) external nonReentrant whenNotPaused {
        require(hasOnboarded[msg.sender], "Not onboarded");
        require(flowerIndex <= 3, "Invalid flower index");
        
        Flower storage flower = userFlowers[msg.sender][flowerIndex];
        require(flower.unlocked, "Flower not unlocked");
        require(flower.level < 5, "Already max level");
        
        uint8 currentLevel = flower.level;
        uint256 cost = upgradeCosts[currentLevel - 1];
        
        // Transfer BLOOM from user
        require(bloomToken.transferFrom(msg.sender, address(this), cost), "Transfer failed");
        
        // Roll for success
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            flowerIndex
        ))) % 10000;
        
        bool success = random < successRates[currentLevel - 1];
        
        uint256 burned = 0;
        uint256 toJackpot = 0;
        uint256 toProtocol = 0;
        
        if (success) {
            // Success: 95% to protocol, 5% to jackpot
            toProtocol = (cost * 95) / 100;
            toJackpot = cost - toProtocol;
            
            require(bloomToken.transfer(protocolTreasury, toProtocol), "Protocol transfer failed");
            require(bloomToken.transfer(jackpotContract, toJackpot), "Jackpot transfer failed");
            
            flower.level = currentLevel + 1;
        } else {
            // Failure: 85% burned, 15% to jackpot
            burned = (cost * 85) / 100;
            toJackpot = cost - burned;
            
            // Burn by sending to dead address
            require(bloomToken.transfer(address(0xdead), burned), "Burn failed");
            require(bloomToken.transfer(jackpotContract, toJackpot), "Jackpot transfer failed");
        }
        
        emit FlowerUpgraded(msg.sender, flowerIndex, flower.level, success, burned, toJackpot, toProtocol);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get all flowers for a user
     */
    function getUserFlowers(address user) external view returns (Flower[4] memory) {
        return userFlowers[user];
    }
    
    /**
     * @notice Get the highest flower level for a user
     */
    function getHighestFlowerLevel(address user) external view returns (uint8) {
        uint8 highest = 0;
        for (uint8 i = 0; i < 4; i++) {
            if (userFlowers[user][i].unlocked && userFlowers[user][i].level > highest) {
                highest = userFlowers[user][i].level;
            }
        }
        return highest;
    }
    
    // ============ Admin Functions ============
    
    function setJackpotContract(address _jackpot) external onlyOwner {
        jackpotContract = _jackpot;
        emit ConfigUpdated("jackpotContract");
    }
    
    function setProtocolTreasury(address _treasury) external onlyOwner {
        protocolTreasury = _treasury;
        emit ConfigUpdated("protocolTreasury");
    }
    
    function setUnlockCost(uint256 _cost) external onlyOwner {
        unlockCost = _cost;
        emit ConfigUpdated("unlockCost");
    }
    
    function setUpgradeCosts(uint256[4] calldata _costs) external onlyOwner {
        upgradeCosts = _costs;
        emit ConfigUpdated("upgradeCosts");
    }
    
    function setSuccessRates(uint16[4] calldata _rates) external onlyOwner {
        successRates = _rates;
        emit ConfigUpdated("successRates");
    }
    
    function addInviteCode(bytes32 code) external onlyOwner {
        validInviteCodes[code] = true;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
