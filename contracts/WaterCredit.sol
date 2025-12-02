// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WaterCredit is ERC20, Ownable {
    uint256 public constant CREDITS_PER_DOLLAR = 100; // 100 credits = $1
    uint256 public constant MIN_PURCHASE = 25 * CREDITS_PER_DOLLAR; // $25 minimum
    
    mapping(address => uint256) public waterUsage;
    mapping(address => uint256) public lastPumpTime;
    
    event WaterPurchased(address indexed user, uint256 amount, uint256 credits);
    event WaterUsed(address indexed user, uint256 credits, uint256 duration);
    
    constructor() ERC20("WaterCredit", "WATER") {}
    
    function purchaseWater() external payable {
        require(msg.value >= (MIN_PURCHASE * 1 ether) / CREDITS_PER_DOLLAR, "Minimum $25 required");
        
        uint256 credits = (msg.value * CREDITS_PER_DOLLAR) / 1 ether;
        _mint(msg.sender, credits);
        
        emit WaterPurchased(msg.sender, msg.value, credits);
    }
    
    function useWater(uint256 credits, uint256 duration) external {
        require(balanceOf(msg.sender) >= credits, "Insufficient water credits");
        require(credits >= 30 * CREDITS_PER_DOLLAR / 100, "Minimum 30 minutes required");
        
        _burn(msg.sender, credits);
        waterUsage[msg.sender] += credits;
        lastPumpTime[msg.sender] = block.timestamp;
        
        emit WaterUsed(msg.sender, credits, duration);
    }
    
    function getWaterBalance(address user) external view returns (uint256) {
        return balanceOf(user);
    }
    
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
