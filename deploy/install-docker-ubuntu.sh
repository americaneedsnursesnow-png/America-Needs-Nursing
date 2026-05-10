#!/usr/bin/env bash
# Optional: install Docker Engine + Compose plugin on Ubuntu/Debian (run with sudo).
# Usage: sudo bash deploy/install-docker-ubuntu.sh
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run with sudo: sudo bash deploy/install-docker-ubuntu.sh"
  exit 1
fi

apt-get update -y
apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Works on Debian too if you replace the URL with docker's Debian repo — this script targets Ubuntu LTS.
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${VERSION_CODENAME}") stable" \
  | tee /etc/apt/sources.list.d/docker.list >/dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable --now docker

echo "Docker installed. Add your SSH user to the docker group (then reconnect SSH):"
echo "  sudo usermod -aG docker \"\$USER\""
echo "Open firewall if you use ufw:"
echo "  sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable"
