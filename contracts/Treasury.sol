// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./WaterCredit.sol";

contract Treasury {
    WaterCredit public waterCredit;
    address public owner;
    
    struct Transaction {
        address user;
        uint256 amount;
        uint256 timestamp;
        string transactionType;
    }
    
    Transaction[] public transactions;
    mapping(address => uint256) public userBalances;
    
    uint256 public totalRevenue;
    uint256 public totalWithdrawn;
    
    event PaymentReceived(address indexed user, uint256 amount, uint256 credits);
    event FundsWithdrawn(address indexed to, uint256 amount);
    event RevenueDistributed(uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    constructor(address _waterCredit) {
        waterCredit = WaterCredit(_waterCredit);
        owner = msg.sender;
    }
    
    function processPayment(address user, uint256 ethAmount) external payable {
        require(msg.value == ethAmount, "Incorrect ETH amount");
        require(ethAmount >= 0.025 ether, "Minimum payment is 0.025 ETH ($25)");
        
        // Calculate water credits (100 credits per 0.001 ETH)
        uint256 credits = (ethAmount * 100000) / 1 ether;
        
        // Mint water credits to user
        waterCredit.mint(user, credits);
        
        // Update balances
        userBalances[user] += ethAmount;
        totalRevenue += ethAmount;
        
        // Record transaction
        transactions.push(Transaction({
            user: user,
            amount: ethAmount,
            timestamp: block.timestamp,
            transactionType: "payment"
        }));
        
        emit PaymentReceived(user, ethAmount, credits);
    }
    
    function withdrawFunds(address payable to, uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        
        totalWithdrawn += amount;
        to.transfer(amount);
        
        transactions.push(Transaction({
            user: to,
            amount: amount,
            timestamp: block.timestamp,
            transactionType: "withdrawal"
        }));
        
        emit FundsWithdrawn(to, amount);
    }
    
    function distributeRevenue(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(totalAmount <= address(this).balance, "Insufficient balance");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            payable(recipients[i]).transfer(amounts[i]);
        }
        
        emit RevenueDistributed(totalAmount);
    }
    
    function getTreasuryStats() external view returns (
        uint256 balance,
        uint256 revenue,
        uint256 withdrawn,
        uint256 transactionCount
    ) {
        return (
            address(this).balance,
            totalRevenue,
            totalWithdrawn,
            transactions.length
        );
    }
    
    function getUserTransactions(address user) external view returns (Transaction[] memory) {
        uint256 count = 0;
        
        // Count user transactions
        for (uint256 i = 0; i < transactions.length; i++) {
            if (transactions[i].user == user) {
                count++;
            }
        }
        
        // Create array of user transactions
        Transaction[] memory userTxs = new Transaction[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < transactions.length; i++) {
            if (transactions[i].user == user) {
                userTxs[index] = transactions[i];
                index++;
            }
        }
        
        return userTxs;
    }
    
    receive() external payable {
        // Allow direct ETH deposits
        totalRevenue += msg.value;
    }
}
