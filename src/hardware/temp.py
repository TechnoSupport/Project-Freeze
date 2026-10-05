import board
import adafruit_dht
import time
import json
import os

pin_name = os.environ.get("DHT_PIN", "D4")
pin = getattr(board, pin_name)
sensor = adafruit_dht.DHT22(pin, use_pulseio=False)

try:
    temperature_c = None
    last_error = None

    for attempt in range(3):
        try:
            temperature_c = sensor.temperature
            if temperature_c is not None:
                break
        except RuntimeError as error:
            last_error = error
        if attempt < 2:
            time.sleep(2)

    if temperature_c is None:
        raise RuntimeError(str(last_error or "No temperature reading"))

    print(json.dumps({
        "temperature_c": temperature_c
    }))
finally:
    sensor.exit()
