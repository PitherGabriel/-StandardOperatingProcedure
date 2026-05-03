#!/bin/bash
df -h
sudo journalctl --vacuum-size=50M
docker system prune -af --volumes
sudo apt-get clean
