from gpiozero import PWMOutputDevice
import sys
import signal

PWM_PIN = 18
PWM_FREQUENCY = 1000

pump = PWMOutputDevice(
    PWM_PIN,
    frequency=PWM_FREQUENCY,
    initial_value=0
)

def set_pump(percent):
    try:
        percent = float(percent)
    except ValueError:
        print("ERROR invalid_number", flush=True)
        return

    percent = max(0.0, min(100.0, percent))

    pump.value = percent / 100.0

    print(f"OK {percent:.1f}", flush=True)

def shutdown(*args):
    pump.value = 0
    pump.close()
    print("STOPPED", flush=True)
    sys.exit(0)

signal.signal(signal.SIGTERM, shutdown)
signal.signal(signal.SIGINT, shutdown)

print("READY", flush=True)

for line in sys.stdin:
    command = line.strip()

    if not command:
        continue

    if command.lower() in ["exit", "quit", "stop"]:
        shutdown()

    set_pump(command)