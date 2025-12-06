const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const logger = require('winston');

class ArduinoController {
  constructor() {
    this.port = null;
    this.parser = null;
    this.isConnected = false;
    this.portPath = process.env.ARDUINO_PORT || '/dev/ttyUSB0'; // Adjust for your system
  }

  async connect() {
    try {
      this.port = new SerialPort({
        path: this.portPath,
        baudRate: 9600
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
      
      this.port.on('open', () => {
        this.isConnected = true;
        logger.info(`Arduino connected on ${this.portPath}`);
      });

      this.port.on('error', (err) => {
        logger.error('Arduino connection error:', err);
        this.isConnected = false;
      });

      this.parser.on('data', (data) => {
        logger.info(`Arduino: ${data}`);
      });

      return true;
    } catch (error) {
      logger.error('Failed to connect to Arduino:', error);
      return false;
    }
  }

  async controlPump(pumpId, action, duration = 30) {
    if (!this.isConnected) {
      logger.warn('Arduino not connected, using mock mode');
      return this.mockPumpControl(pumpId, action, duration);
    }

    try {
      let command;
      if (action === 'on') {
        command = `PUMP${pumpId.slice(-1)}_ON:${duration}\n`;
      } else {
        command = `PUMP${pumpId.slice(-1)}_OFF\n`;
      }

      this.port.write(command);
      logger.info(`Sent to Arduino: ${command.trim()}`);
      
      return {
        success: true,
        pump: pumpId,
        status: action,
        duration: action === 'on' ? duration : 0,
        hardware: 'arduino'
      };
    } catch (error) {
      logger.error('Arduino pump control error:', error);
      return { success: false, error: error.message };
    }
  }

  async getStatus() {
    if (!this.isConnected) {
      return {
        pump1: 'unknown',
        pump2: 'unknown',
        hardware: 'disconnected'
      };
    }

    try {
      this.port.write('STATUS\n');
      
      // In a real implementation, you'd wait for the response
      // For now, return basic status
      return {
        pump1: 'off',
        pump2: 'off',
        hardware: 'arduino',
        connected: true
      };
    } catch (error) {
      logger.error('Arduino status error:', error);
      return { error: error.message };
    }
  }

  mockPumpControl(pumpId, action, duration) {
    logger.info(`[MOCK ARDUINO] Pump ${pumpId} ${action} for ${duration}min`);
    return {
      success: true,
      pump: pumpId,
      status: action,
      duration: action === 'on' ? duration : 0,
      hardware: 'mock_arduino'
    };
  }

  disconnect() {
    if (this.port && this.port.isOpen) {
      this.port.close();
      this.isConnected = false;
      logger.info('Arduino disconnected');
    }
  }
}

module.exports = new ArduinoController();
