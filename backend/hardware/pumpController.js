const { SerialPort } = require('serialport');
const logger = require('winston');

class PumpController {
  constructor() {
    this.pumps = {
      pump1: { status: 'off', port: '/dev/ttyUSB0' },
      pump2: { status: 'off', port: '/dev/ttyUSB1' }
    };
    this.mockMode = process.env.MOCK_HARDWARE === 'true';
  }

  async controlPump(pumpId, action, duration = 30) {
    try {
      if (this.mockMode) {
        return this.mockControl(pumpId, action, duration);
      }

      const pump = this.pumps[pumpId];
      if (!pump) throw new Error(`Pump ${pumpId} not found`);

      // Send command to hardware
      const command = this.buildCommand(action, duration);
      await this.sendSerialCommand(pump.port, command);

      pump.status = action;
      logger.info(`Pump ${pumpId} ${action} for ${duration} minutes`);

      // Auto-stop after duration
      if (action === 'on') {
        setTimeout(() => {
          this.controlPump(pumpId, 'off');
        }, duration * 60 * 1000);
      }

      return { success: true, pump: pumpId, status: action, duration };
    } catch (error) {
      logger.error(`Pump control error: ${error.message}`);
      throw error;
    }
  }

  mockControl(pumpId, action, duration) {
    this.pumps[pumpId].status = action;
    logger.info(`[MOCK] Pump ${pumpId} ${action} for ${duration} minutes`);
    
    if (action === 'on') {
      setTimeout(() => {
        this.pumps[pumpId].status = 'off';
        logger.info(`[MOCK] Pump ${pumpId} auto-stopped`);
      }, duration * 60 * 1000);
    }

    return { success: true, pump: pumpId, status: action, duration };
  }

  buildCommand(action, duration) {
    // Nema 17 stepper motor commands
    const commands = {
      on: `START:${duration}`,
      off: 'STOP'
    };
    return commands[action] || 'STOP';
  }

  async sendSerialCommand(port, command) {
    return new Promise((resolve, reject) => {
      const serialPort = new SerialPort({ path: port, baudRate: 9600 });
      
      serialPort.on('open', () => {
        serialPort.write(command, (err) => {
          if (err) reject(err);
          else resolve();
          serialPort.close();
        });
      });

      serialPort.on('error', reject);
    });
  }

  getStatus() {
    return Object.fromEntries(
      Object.entries(this.pumps).map(([id, pump]) => [id, pump.status])
    );
  }
}

module.exports = new PumpController();
