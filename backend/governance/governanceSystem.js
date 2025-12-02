const eventLogger = require('../analytics/eventLogger');
const logger = require('winston');

class GovernanceSystem {
  constructor() {
    this.proposals = new Map();
    this.votes = new Map();
    this.systemParameters = {
      minPaymentAmount: 25,
      maxPumpDuration: 240, // 4 hours
      fraudThreshold: 70,
      emergencyStopEnabled: true
    };
    this.emergencyMode = false;
    this.adminAddresses = new Set(['0x1234...', '0x5678...']); // Mock admin addresses
  }

  async createProposal(proposalData) {
    const proposalId = `prop_${Date.now()}`;
    
    const proposal = {
      id: proposalId,
      title: proposalData.title,
      description: proposalData.description,
      proposer: proposalData.proposer,
      type: proposalData.type, // 'parameter_change', 'emergency_action', 'upgrade'
      parameters: proposalData.parameters,
      status: 'active',
      votesFor: 0,
      votesAgainst: 0,
      createdAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      executed: false
    };
    
    this.proposals.set(proposalId, proposal);
    
    await eventLogger.logEvent('governance_proposal', {
      proposalId,
      title: proposal.title,
      type: proposal.type,
      proposer: proposal.proposer
    });
    
    logger.info(`Governance proposal created: ${proposalId}`);
    return proposal;
  }

  async vote(proposalId, voter, support, votingPower = 1) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }
    
    if (proposal.status !== 'active' || Date.now() > proposal.expiresAt) {
      throw new Error('Proposal voting period has ended');
    }
    
    const voteKey = `${proposalId}_${voter}`;
    if (this.votes.has(voteKey)) {
      throw new Error('Already voted on this proposal');
    }
    
    // Record vote
    this.votes.set(voteKey, {
      proposalId,
      voter,
      support,
      votingPower,
      timestamp: Date.now()
    });
    
    // Update proposal vote counts
    if (support) {
      proposal.votesFor += votingPower;
    } else {
      proposal.votesAgainst += votingPower;
    }
    
    await eventLogger.logEvent('governance_vote', {
      proposalId,
      voter,
      support,
      votingPower
    });
    
    // Check if proposal should be executed
    await this.checkProposalExecution(proposalId);
    
    return { success: true, proposal };
  }

  async checkProposalExecution(proposalId) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.executed) return;
    
    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const quorum = 10; // Minimum votes needed
    const majority = proposal.votesFor > proposal.votesAgainst;
    
    if (totalVotes >= quorum && majority) {
      await this.executeProposal(proposalId);
    }
  }

  async executeProposal(proposalId) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return;
    
    try {
      switch (proposal.type) {
        case 'parameter_change':
          await this.updateSystemParameters(proposal.parameters);
          break;
        case 'emergency_action':
          await this.executeEmergencyAction(proposal.parameters);
          break;
        case 'upgrade':
          await this.scheduleUpgrade(proposal.parameters);
          break;
      }
      
      proposal.executed = true;
      proposal.status = 'executed';
      
      await eventLogger.logEvent('governance_execution', {
        proposalId,
        type: proposal.type,
        parameters: proposal.parameters
      });
      
      logger.info(`Proposal executed: ${proposalId}`);
    } catch (error) {
      proposal.status = 'failed';
      logger.error(`Proposal execution failed: ${error.message}`);
    }
  }

  async updateSystemParameters(parameters) {
    Object.keys(parameters).forEach(key => {
      if (this.systemParameters.hasOwnProperty(key)) {
        this.systemParameters[key] = parameters[key];
        logger.info(`System parameter updated: ${key} = ${parameters[key]}`);
      }
    });
  }

  async executeEmergencyAction(parameters) {
    switch (parameters.action) {
      case 'emergency_stop':
        this.emergencyMode = true;
        logger.warn('Emergency stop activated');
        break;
      case 'resume_operations':
        this.emergencyMode = false;
        logger.info('Operations resumed');
        break;
      case 'update_fraud_threshold':
        this.systemParameters.fraudThreshold = parameters.threshold;
        logger.info(`Fraud threshold updated to ${parameters.threshold}`);
        break;
    }
  }

  async scheduleUpgrade(parameters) {
    logger.info(`System upgrade scheduled: ${parameters.version}`);
    // In a real system, this would trigger deployment processes
  }

  async emergencyStop(adminAddress, reason) {
    if (!this.adminAddresses.has(adminAddress)) {
      throw new Error('Unauthorized: Not an admin address');
    }
    
    this.emergencyMode = true;
    
    await eventLogger.logEvent('emergency_stop', {
      adminAddress,
      reason,
      timestamp: Date.now()
    });
    
    logger.warn(`Emergency stop activated by ${adminAddress}: ${reason}`);
    return { success: true, emergencyMode: true };
  }

  async getGovernanceStats() {
    const activeProposals = Array.from(this.proposals.values())
      .filter(p => p.status === 'active').length;
    
    const executedProposals = Array.from(this.proposals.values())
      .filter(p => p.executed).length;
    
    const totalVotes = this.votes.size;
    
    return {
      activeProposals,
      executedProposals,
      totalVotes,
      emergencyMode: this.emergencyMode,
      systemParameters: this.systemParameters,
      timestamp: new Date().toISOString()
    };
  }

  getSystemParameters() {
    return { ...this.systemParameters };
  }

  isEmergencyMode() {
    return this.emergencyMode;
  }

  async getActiveProposals() {
    return Array.from(this.proposals.values())
      .filter(p => p.status === 'active' && Date.now() < p.expiresAt);
  }
}

module.exports = new GovernanceSystem();
