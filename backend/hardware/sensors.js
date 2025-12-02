const { SerialPort } = require('serialport');
const logger = require('winston');

class SensorManager {
  constructor() {
    this.sensors = {
      flowRate: { value: 0, unit: 'L/min' },
      pressure: { value: 0, unit: 'PSI' },
      temperature: { value: 20, unit: '°C' },
      waterLevel: { value: 100, unit: '%' }
    };
    this.mockMode = process.env.MOCK_HARDWARE === 'true';
    this.startReading();
  }

  startReading() {
    if (this.mockMode) {
      this.startMockReading();
    } else {
      this.startRealReading();
    }
  }

  startMockReading() {
    setInterval(() => {
      this.sensors.flowRate.value = Math.random() * 10;
      this.sensors.pressure.value = 15 + Math.random() * 5;
      this.sensors.temperature.value = 18 + Math.random() * 8;
      this.sensors.waterLevel.value = Math.max(0, this.sensors.waterLevel.value - Math.random() * 0.1);
    }, 5000);
  }

  startRealReading() {
    // Connect to sensor Arduino/microcontroller
    try {
      const sensorPort = new SerialPort({ 
        path: '/dev/ttyACM0', 
        baudRate: 9600 
      });

      sensorPort.on('data', (data) => {
        this.parseSensorData(data.toString());
      });

      sensorPort.on('error', (err) => {
        logger.error(`Sensor error: ${err.message}`);
        this.startMockReading(); // Fallback to mock
      });
    } catch (error) {
      logger.warn('Real sensors not available, using mock data');
      this.startMockReading();
    }
  }

  parseSensorData(data) {
    try {
      // Expected format: "FLOW:5.2,PRESSURE:18.5,TEMP:22.1,LEVEL:85.3"
      const readings = data.split(',');
      readings.forEach(reading => {
        const [sensor, value] = reading.split(':');
        switch(sensor) {
          case 'FLOW':
            this.sensors.flowRate.value = parseFloat(value);
            break;
          case 'PRESSURE':
            this.sensors.pressure.value = parseFloat(value);
            break;
          case 'TEMP':
            this.sensors.temperature.value = parseFloat(value);
            break;
          case 'LEVEL':
            this.sensors.waterLevel.value = parseFloat(value);
            break;
        }
      });
    } catch (error) {
      logger.error(`Sensor data parsing error: ${error.message}`);
    }
  }

  getSensorData() {
    return {
      ...this.sensors,
      timestamp: new Date().toISOString(),
      mockMode: this.mockMode
    };
  }

  getAlerts() {
    const alerts = [];
    
    if (this.sensors.pressure.value < 10) {
      alerts.push({ type: 'warning', message: 'Low water pressure detected' });
    }
    
    if (this.sensors.waterLevel.value < 20) {
      alerts.push({ type: 'critical', message: 'Water level critically low' });
    }
    
    if (this.sensors.temperature.value > 30) {
      alerts.push({ type: 'warning', message: 'High temperature detected' });
    }

    return alerts;
  }
}

module.exports = new SensorManager();
