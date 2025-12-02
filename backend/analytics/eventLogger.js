const db = require('../database/connection');
const logger = require('winston');

class EventLogger {
  async logEvent(type, data) {
    try {
      await db.run(
        'INSERT INTO events (type, data) VALUES (?, ?)',
        [type, JSON.stringify(data)]
      );
      logger.info(`Event logged: ${type}`);
    } catch (error) {
      logger.error(`Event logging error: ${error.message}`);
    }
  }

  async logPayment(paymentData) {
    try {
      await db.run(
        'INSERT INTO payments (paymentId, amount, customer, processed, aiDecision) VALUES (?, ?, ?, ?, ?)',
        [paymentData.paymentId, paymentData.amount, paymentData.customer, paymentData.processed, paymentData.aiDecision]
      );
      
      await this.logEvent('payment', paymentData);
    } catch (error) {
      logger.error(`Payment logging error: ${error.message}`);
    }
  }

  async logPumpAction(pumpId, status, duration) {
    try {
      await db.run(
        'INSERT INTO pump_status (pumpId, status, duration) VALUES (?, ?, ?)',
        [pumpId, status, duration]
      );
      
      await this.logEvent('pump_action', { pumpId, status, duration });
    } catch (error) {
      logger.error(`Pump action logging error: ${error.message}`);
    }
  }

  async logMetric(metric, value) {
    try {
      await db.run(
        'INSERT INTO analytics (metric, value) VALUES (?, ?)',
        [metric, value]
      );
    } catch (error) {
      logger.error(`Metric logging error: ${error.message}`);
    }
  }

  async getEvents(limit = 100) {
    try {
      return await db.query(
        'SELECT * FROM events ORDER BY timestamp DESC LIMIT ?',
        [limit]
      );
    } catch (error) {
      logger.error(`Get events error: ${error.message}`);
      return [];
    }
  }

  async getPayments(limit = 50) {
    try {
      return await db.query(
        'SELECT * FROM payments ORDER BY timestamp DESC LIMIT ?',
        [limit]
      );
    } catch (error) {
      logger.error(`Get payments error: ${error.message}`);
      return [];
    }
  }

  async getAnalytics(metric, hours = 24) {
    try {
      return await db.query(
        'SELECT * FROM analytics WHERE metric = ? AND timestamp > datetime("now", "-" || ? || " hours") ORDER BY timestamp DESC',
        [metric, hours]
      );
    } catch (error) {
      logger.error(`Get analytics error: ${error.message}`);
      return [];
    }
  }
}

module.exports = new EventLogger();
