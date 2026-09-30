import board
import adafruit_dht
import time
import json
sensor = adafruit_dht.DHT22(board.D4)

try:
    temperature_c = sensor.temperature

    print(json.dumps({
        "temperature_c": temperature_c
    }))
finally:
    sensor.exit()
