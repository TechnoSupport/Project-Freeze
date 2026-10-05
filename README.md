# Project Freeze

Raspberry Pi dashboard and hardware controller for the NASA HUNCH Project Freeze prototype.

## Raspberry Pi setup

Use Raspberry Pi OS Bookworm or newer. The default wiring is:

- DHT22 data: GPIO 4 (`D4`)
- PCA9685: Pi I²C bus (SDA GPIO 2, SCL GPIO 3)
- Pump driver: PCA9685 channel 0

From the cloned repo on the Pi:

```bash
chmod +x scripts/install-pi.sh scripts/start-kiosk.sh
sudo ./scripts/install-pi.sh --kiosk
sudo reboot
```

Use `--kiosk` when the Pi has a desktop and connected display since we are using a pi with 

- installs Node.js, Python, I²C/GPIO, and Adafruit dependencies;
- enables I²C;
- builds the TypeScript app;
- installs and starts a `project-freeze` system service;
- restricts shutdown/reboot permission to the exact commands used by the dashboard;
- optionally opens Chromium full-screen when the desktop starts.

After reboot, open `http://localhost:3000` on the Pi or `http://PI-IP-ADDRESS:3000` on another device. Power controls intentionally work only from the Pi itself.

## Configuration

The installer creates `config/project-freeze.env`. Edit it if the sensor pin, PCA9685 channel, frequency, or port is different:

```bash
nano config/project-freeze.env
sudo systemctl restart project-freeze
```

GPIO names use Blinka board names. For example, physical pin 7 / BCM GPIO 4 is `D4`.

## Updating from GitHub

```bash
git pull
sudo ./scripts/install-pi.sh --kiosk
```

Inventory is stored in `data/inventory.json`; it is ignored by Git and survives updates.

## Checks and troubleshooting

```bash
sudo systemctl status project-freeze --no-pager
sudo journalctl -u project-freeze -n 100 --no-pager
i2cdetect -y 1
curl http://localhost:3000/api/health
```

The PCA9685 normally appears at address `40` in `i2cdetect`. If the service says `CHECK HARDWARE`, verify 3.3 V logic power, common ground, SDA/SCL wiring, the DHT22 pull-up resistor, and the settings in `config/project-freeze.env`.

## Development

```bash
npm ci
npm run dev
```
