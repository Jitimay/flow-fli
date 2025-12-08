MajiSafe 

We create intelligent, affordable IoT and AI systems that improve daily services, from vending to public access tools, for real community impact.

## Inspiration

In many regions, water pumps fail unexpectedly because no one notices problems early. We wanted to build a fast, low-cost, offline-friendly system that lets communities monitor pumps using simple SMS commands — no smartphones required.

And that’s how MajiSafe was built:
A real, hardware-powered smart water pump controller using IoT, SMS, and AI anomaly detection.

## What it does

MajiSafe is NOT a simulation — it is a working, physical water pump system that can be controlled and monitored using SMS.

It provides:

📡 Real-time sensor readings (flow, pressure, vibration)

🔧 Remote pump ON/OFF via SMS

📨 Alerts when issues appear

🤖 AI-based anomaly detection

🖥️ Dashboard for monitoring water usage

📶 Works even without internet — only GSM SMS

It solves breakdowns, improves transparency, and keeps pumps functional.

## How we built it

Hardware:

ESP32 + SIM800L for GSM communication

Flow sensor for water measurement

Pressure & vibration sensors for pump health

Real water pump motor

Relay control system

Software:

SMS command parser

AI anomaly detector (Python)

REST API for the dashboard

Realtime UI built with modern JS

The ESP32 reads sensor data, sends logs through SMS, receives commands, and controls the pump physically.

## Challenges we faced

Optimizing sensor accuracy on low-cost hardware

Making SMS communication fast and reliable

Managing power usage

Ensuring the pump responds safely under varying water pressure

Building the dashboard and AI module within hackathon time

## Accomplishments

Fully functional pump system running live

Real SMS-based control

Real-time monitoring dashboard

AI detecting unusual pump behavior

Successfully tested with real water flow

## What’s next

Add mobile payments (Lumicash, M-Pesa)

Deploy first installations

Add predictive maintenance

Package as low-cost IoT kit


https://github.com/Jitimay/maji-safe

https://www.youtube.com/watch?v=1B3T0LDmfFI&t=11s
