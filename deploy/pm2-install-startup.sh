#!/usr/bin/env bash
# Install PM2 systemd startup for the user who ran sudo (SUDO_USER).
# CI runs: sudo env PATH=$PATH ./deploy/pm2-install-startup.sh
# One-time per server: add to sudoers (see docs/DEPLOY.md):
#   <user> ALL=(ALL) NOPASSWD: <REPO_PATH>/deploy/pm2-install-startup.sh, /usr/bin/systemctl start pm2-*, /usr/bin/systemctl stop pm2-*
set -e
REAL_USER=${SUDO_USER:-$USER}
REAL_HOME=$(getent passwd "$REAL_USER" | cut -d: -f6)
exec env PATH="$PATH" pm2 startup systemd -u "$REAL_USER" --hp "$REAL_HOME"
