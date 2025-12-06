# FlowFli Arduino Mega Setup Guide

## 🔌 **Hardware Connections**

### **Required Components:**
- Arduino Mega 2560
- 2x Relay modules (5V)
- Water pumps (12V DC recommended)
- Power supply for pumps
- Jumper wires

### **Wiring Diagram:**

```
Arduino Mega    →    Relay Module    →    Pump
─────────────────────────────────────────────────
Pin 7           →    IN1             →    Pump 1
Pin 8           →    IN2             →    Pump 2
5V              →    VCC             
GND             →    GND             
                     COM             →    Pump +12V
                     NO              →    Pump Ground
```

### **Detailed Connections:**

**Relay 1 (Pump 1):**
- Arduino Pin 7 → Relay IN1
- Arduino 5V → Relay VCC
- Arduino GND → Relay GND
- Relay COM → +12V Power Supply
- Relay NO → Pump 1 Positive
- Pump 1 Negative → Power Supply Ground

**Relay 2 (Pump 2):**
- Arduino Pin 8 → Relay IN2
- Same power connections as Relay 1
- Relay NO → Pump 2 Positive
- Pump 2 Negative → Power Supply Ground

**Status LED:**
- Arduino Pin 13 → Built-in LED (no wiring needed)

## 💻 **Software Setup**

### **1. Upload Arduino Code:**
```bash
# Open Arduino IDE
# Load: /arduino/flowfli_pump_controller.ino
# Select: Arduino Mega 2560
# Upload to board
```

### **2. Install Node.js Dependencies:**
```bash
cd /home/josh/Kiro/FlowFli/backend
npm install serialport @serialport/parser-readline
```

### **3. Configure Serial Port:**
```bash
# Find Arduino port
ls /dev/tty*

# Update .env file
echo "ARDUINO_PORT=/dev/ttyUSB0" >> .env
echo "HARDWARE_MODE=arduino" >> .env
```

## 🧪 **Testing**

### **Arduino Serial Monitor Test:**
```
Commands to test:
PUMP1_ON:5    # Turn on pump 1 for 5 minutes
PUMP2_ON:10   # Turn on pump 2 for 10 minutes  
PUMP1_OFF     # Turn off pump 1
STATUS        # Get pump status
```

### **FlowFli Integration Test:**
```bash
# Start FlowFli with Arduino
cd /home/josh/Kiro/FlowFli
HARDWARE_MODE=arduino npm start

# Test payment (should activate real pump)
curl -X POST http://localhost:3002/api/simulate-payment \
  -H "Content-Type: application/json" \
  -d '{"amount": 25, "customer": "arduino_test"}'
```

## ⚠️ **Safety Notes**

- **Power Supply**: Use appropriate 12V supply for pumps
- **Relay Rating**: Ensure relays can handle pump current
- **Water Safety**: Keep electronics away from water
- **Emergency Stop**: Always have manual pump shutoff
- **Testing**: Test with low-power devices first

## 🔧 **Troubleshooting**

**Arduino Not Detected:**
```bash
# Check USB connection
lsusb | grep Arduino

# Check permissions
sudo chmod 666 /dev/ttyUSB0
```

**Pumps Not Activating:**
- Check relay wiring
- Verify power supply voltage
- Test relays with multimeter
- Check pump current draw

**Serial Communication Issues:**
- Verify baud rate (9600)
- Check cable quality
- Try different USB port
- Reset Arduino

## 🏆 **FlowFli + Arduino = Real IoT!**

With this setup, FlowFli becomes a **real IoT water management system**:

- ✅ **AI decides** → Arduino executes
- ✅ **Payment processed** → Real pump activates  
- ✅ **Fraud detected** → Pump stays off
- ✅ **Timer expires** → Auto-shutoff safety

**Perfect for hackathon demo showing real hardware control!** 🚰🤖
