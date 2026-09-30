import sys
import json
import board
import busio
from adafruit_pca9685 import PCA9685

PUMP_CHANNEL = 0

i2c = busio.I2C(board.SCL, board.SDA)
pca = PCA9685(i2c)
pca.frequency = 500

pump = pca.channels[PUMP_CHANNEL]


def set_pump_speed(percent: float):
    percent = max(0, min(100, percent))

    duty_cycle = int((percent / 100) * 65535)

    pump.duty_cycle = duty_cycle

    return percent


def get_pump_speed():
    duty_cycle = pump.duty_cycle

    percent = (duty_cycle / 65535) * 100

    return round(percent, 1)


try:
    command = sys.argv[1]

    if command == "set":
        percent = float(sys.argv[2])

        speed = set_pump_speed(percent)

        print(json.dumps({
            "speed": speed
        }))

    elif command == "get":
        speed = get_pump_speed()

        print(json.dumps({
            "speed": speed
        }))

    else:
        print(json.dumps({
            "error": "Unknown command"
        }))

finally:
    pca.deinit()