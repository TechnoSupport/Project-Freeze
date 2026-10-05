#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Run this installer with sudo: sudo ./scripts/install-pi.sh [--kiosk]" >&2
  exit 1
fi

SERVICE_USER=${SUDO_USER:-}
if [[ -z "$SERVICE_USER" || "$SERVICE_USER" == "root" ]]; then
  echo "Run this installer from the normal Pi account using sudo." >&2
  exit 1
fi

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
PROJECT_DIR=$(cd -- "$SCRIPT_DIR/.." && pwd)
SERVICE_GROUP=$(id -gn "$SERVICE_USER")
USER_HOME=$(getent passwd "$SERVICE_USER" | cut -d: -f6)
ENABLE_KIOSK=false
[[ ${1:-} == "--kiosk" ]] && ENABLE_KIOSK=true

echo "Installing operating-system packages..."
apt-get update
apt-get install -y nodejs npm python3 python3-venv python3-dev python3-libgpiod build-essential i2c-tools libgpiod-dev curl sudo

if apt-cache show libgpiod2 >/dev/null 2>&1; then
  apt-get install -y libgpiod2
elif apt-cache show libgpiod3 >/dev/null 2>&1; then
  apt-get install -y libgpiod3
fi

NODE_MAJOR=$(node --version | sed -E 's/^v([0-9]+).*/\1/')
if (( NODE_MAJOR < 18 )); then
  echo "Node.js 18 or newer is required; this Pi has $(node --version)." >&2
  exit 1
fi

if command -v raspi-config >/dev/null 2>&1; then
  raspi-config nonint do_i2c 0
fi

usermod -aG gpio,i2c "$SERVICE_USER"

echo "Installing project dependencies and building the dashboard..."
runuser -u "$SERVICE_USER" -- python3 -m venv --system-site-packages "$PROJECT_DIR/.venv"
runuser -u "$SERVICE_USER" -- "$PROJECT_DIR/.venv/bin/python" -m pip install --upgrade pip
runuser -u "$SERVICE_USER" -- "$PROJECT_DIR/.venv/bin/pip" install -r "$PROJECT_DIR/requirements.txt"
runuser -u "$SERVICE_USER" -- npm ci --prefix "$PROJECT_DIR"
runuser -u "$SERVICE_USER" -- npm run build --prefix "$PROJECT_DIR"

install -d -o "$SERVICE_USER" -g "$SERVICE_GROUP" "$PROJECT_DIR/config" "$PROJECT_DIR/data"
if [[ ! -f "$PROJECT_DIR/config/project-freeze.env" ]]; then
  install -o "$SERVICE_USER" -g "$SERVICE_GROUP" -m 0640 \
    "$PROJECT_DIR/config/project-freeze.env.example" "$PROJECT_DIR/config/project-freeze.env"
fi

cat > /etc/systemd/system/project-freeze.service <<EOF
[Unit]
Description=Project Freeze controller
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_GROUP
SupplementaryGroups=gpio i2c
WorkingDirectory=$PROJECT_DIR
EnvironmentFile=$PROJECT_DIR/config/project-freeze.env
Environment=NODE_ENV=production
Environment=PYTHON_BIN=$PROJECT_DIR/.venv/bin/python3
Environment=INVENTORY_FILE=$PROJECT_DIR/data/inventory.json
ExecStart=/usr/bin/node $PROJECT_DIR/dist/index.js
Restart=on-failure
RestartSec=5
TimeoutStopSec=15

[Install]
WantedBy=multi-user.target
EOF

SUDOERS_FILE="/etc/sudoers.d/project-freeze-$SERVICE_USER"
cat > "$SUDOERS_FILE" <<EOF
$SERVICE_USER ALL=(root) NOPASSWD: /usr/bin/systemctl reboot, /usr/bin/systemctl poweroff
EOF
chmod 0440 "$SUDOERS_FILE"
visudo -cf "$SUDOERS_FILE" >/dev/null

if [[ "$ENABLE_KIOSK" == true ]]; then
  if apt-cache show chromium >/dev/null 2>&1; then
    apt-get install -y chromium
  else
    apt-get install -y chromium-browser
  fi
  AUTOSTART_DIR="$USER_HOME/.config/autostart"
  install -d -o "$SERVICE_USER" -g "$SERVICE_GROUP" "$AUTOSTART_DIR"
  cat > "$AUTOSTART_DIR/project-freeze.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Project Freeze
Exec="$PROJECT_DIR/scripts/start-kiosk.sh"
Terminal=false
X-GNOME-Autostart-enabled=true
EOF
  chown "$SERVICE_USER:$SERVICE_GROUP" "$AUTOSTART_DIR/project-freeze.desktop"
fi

systemctl daemon-reload
systemctl enable --now project-freeze.service

echo
echo "Project Freeze is installed and running."
echo "Dashboard: http://$(hostname -I | awk '{print $1}'):3000"
echo "Status:    sudo systemctl status project-freeze --no-pager"
echo "Logs:      sudo journalctl -u project-freeze -f"
echo "Reboot once so the new GPIO/I2C group membership takes effect."
