// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./WaterCredit.sol";

contract AgentController {
    WaterCredit public waterCredit;
    
    struct Agent {
        address agentAddress;
        bool isActive;
        uint256 totalTransactions;
        uint256 lastActivity;
    }
    
    mapping(address => Agent) public agents;
    mapping(address => bool) public authorizedAgents;
    
    event AgentRegistered(address indexed agent);
    event PumpActivated(address indexed user, address indexed agent, uint256 duration);
    event AgentDeactivated(address indexed agent);
    
    modifier onlyAuthorizedAgent() {
        require(authorizedAgents[msg.sender], "Not authorized agent");
        _;
    }
    
    constructor(address _waterCredit) {
        waterCredit = WaterCredit(_waterCredit);
    }
    
    function registerAgent(address agentAddress) external {
        require(!agents[agentAddress].isActive, "Agent already registered");
        
        agents[agentAddress] = Agent({
            agentAddress: agentAddress,
            isActive: true,
            totalTransactions: 0,
            lastActivity: block.timestamp
        });
        
        authorizedAgents[agentAddress] = true;
        
        emit AgentRegistered(agentAddress);
    }
    
    function activatePump(address user, uint256 duration) external onlyAuthorizedAgent {
        uint256 creditsNeeded = (duration * 100) / 30; // 100 credits per 30 minutes
        
        require(waterCredit.balanceOf(user) >= creditsNeeded, "Insufficient credits");
        
        // Use water credits
        waterCredit.useWater(creditsNeeded, duration);
        
        // Update agent stats
        agents[msg.sender].totalTransactions++;
        agents[msg.sender].lastActivity = block.timestamp;
        
        emit PumpActivated(user, msg.sender, duration);
    }
    
    function deactivateAgent(address agentAddress) external {
        require(agents[agentAddress].isActive, "Agent not active");
        
        agents[agentAddress].isActive = false;
        authorizedAgents[agentAddress] = false;
        
        emit AgentDeactivated(agentAddress);
    }
    
    function getAgentStats(address agentAddress) external view returns (Agent memory) {
        return agents[agentAddress];
    }
}
