const eventLogger = require('../analytics/eventLogger');
const logger = require('winston');

class FraudDetection {
  constructor() {
    this.suspiciousPatterns = new Map();
    this.userBehavior = new Map();
    this.riskThresholds = {
      rapidPayments: 5, // 5 payments in 10 minutes
      unusualAmounts: 1000, // Payments over $1000
      frequentFailures: 3, // 3 failed payments in 5 minutes
      geographicAnomaly: true
    };
  }

  async analyzePayment(paymentData) {
    const risks = [];
    const userId = paymentData.customer;
    
    // Track user behavior
    this.updateUserBehavior(userId, paymentData);
    
    // Check for rapid payment pattern
    if (this.detectRapidPayments(userId)) {
      risks.push({ type: 'rapid_payments', severity: 'high', message: 'Unusual payment frequency detected' });
    }
    
    // Check for unusual amounts
    if (this.detectUnusualAmounts(paymentData.amount)) {
      risks.push({ type: 'unusual_amount', severity: 'medium', message: `Payment amount $${paymentData.amount} exceeds normal range` });
    }
    
    // Check for repeated failures
    if (this.detectRepeatedFailures(userId)) {
      risks.push({ type: 'repeated_failures', severity: 'high', message: 'Multiple failed payment attempts detected' });
    }
    
    // AI-powered anomaly detection
    const aiRisk = await this.aiAnomalyDetection(paymentData);
    if (aiRisk.isAnomalous) {
      risks.push({ type: 'ai_anomaly', severity: aiRisk.severity, message: aiRisk.reason });
    }
    
    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(risks);
    
    // Log fraud analysis
    await eventLogger.logEvent('fraud_analysis', {
      paymentId: paymentData.paymentId,
      userId,
      risks,
      riskScore,
      action: riskScore > 70 ? 'blocked' : 'approved'
    });
    
    return {
      riskScore,
      risks,
      shouldBlock: riskScore > 70,
      recommendation: this.getRecommendation(riskScore)
    };
  }

  updateUserBehavior(userId, paymentData) {
    if (!this.userBehavior.has(userId)) {
      this.userBehavior.set(userId, {
        payments: [],
        failures: [],
        totalAmount: 0,
        firstSeen: Date.now()
      });
    }
    
    const behavior = this.userBehavior.get(userId);
    behavior.payments.push({
      amount: paymentData.amount,
      timestamp: Date.now(),
      success: paymentData.processed !== false
    });
    
    if (!paymentData.processed) {
      behavior.failures.push(Date.now());
    }
    
    behavior.totalAmount += paymentData.amount;
    
    // Keep only recent data (last 24 hours)
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    behavior.payments = behavior.payments.filter(p => p.timestamp > dayAgo);
    behavior.failures = behavior.failures.filter(f => f > dayAgo);
  }

  detectRapidPayments(userId) {
    const behavior = this.userBehavior.get(userId);
    if (!behavior) return false;
    
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    const recentPayments = behavior.payments.filter(p => p.timestamp > tenMinutesAgo);
    
    return recentPayments.length >= this.riskThresholds.rapidPayments;
  }

  detectUnusualAmounts(amount) {
    return amount > this.riskThresholds.unusualAmounts;
  }

  detectRepeatedFailures(userId) {
    const behavior = this.userBehavior.get(userId);
    if (!behavior) return false;
    
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentFailures = behavior.failures.filter(f => f > fiveMinutesAgo);
    
    return recentFailures.length >= this.riskThresholds.frequentFailures;
  }

  async aiAnomalyDetection(paymentData) {
    try {
      // Simple heuristic-based anomaly detection
      const anomalies = [];
      
      // Check payment timing patterns
      if (this.isOffHours(paymentData.timestamp)) {
        anomalies.push('Payment made during unusual hours');
      }
      
      // Check amount patterns
      if (paymentData.amount % 1 !== 0 && paymentData.amount > 100) {
        anomalies.push('Unusual decimal amount for large payment');
      }
      
      // Check customer ID patterns
      if (paymentData.customer.includes('test') && paymentData.amount > 50) {
        anomalies.push('Test account making large payment');
      }
      
      const isAnomalous = anomalies.length > 0;
      const severity = anomalies.length > 1 ? 'high' : 'medium';
      
      return {
        isAnomalous,
        severity,
        reason: anomalies.join(', ') || 'No anomalies detected',
        confidence: isAnomalous ? 0.8 : 0.2
      };
    } catch (error) {
      logger.error(`AI anomaly detection error: ${error.message}`);
      return { isAnomalous: false, severity: 'low', reason: 'Analysis failed' };
    }
  }

  isOffHours(timestamp) {
    const date = new Date(timestamp);
    const hour = date.getHours();
    return hour < 6 || hour > 22; // Consider 10 PM - 6 AM as off hours
  }

  calculateRiskScore(risks) {
    let score = 0;
    
    risks.forEach(risk => {
      switch (risk.severity) {
        case 'high':
          score += 40;
          break;
        case 'medium':
          score += 25;
          break;
        case 'low':
          score += 10;
          break;
      }
    });
    
    return Math.min(score, 100);
  }

  getRecommendation(riskScore) {
    if (riskScore > 70) return 'Block payment and require manual review';
    if (riskScore > 40) return 'Allow with enhanced monitoring';
    if (riskScore > 20) return 'Allow with standard monitoring';
    return 'Allow payment';
  }

  async getSecurityReport() {
    const totalUsers = this.userBehavior.size;
    const suspiciousUsers = Array.from(this.userBehavior.entries())
      .filter(([_, behavior]) => behavior.failures.length > 2).length;
    
    return {
      totalUsers,
      suspiciousUsers,
      riskLevel: suspiciousUsers / totalUsers > 0.1 ? 'high' : 'low',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new FraudDetection();
