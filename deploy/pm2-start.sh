#!/bin/bash
# Example PM2 startup script for production
# Usage: chmod +x pm2-start.sh && ./pm2-start.sh

# Install pm2 globally if missing
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

# Start server
pm2 start server/index.js --name gow-server --update-env --time

# Start Next (assumes built client in client/.next and start script in client/package.json)
cd client
pm2 start "npm -- start" --name gow-client --update-env --time
cd ..

# Save process list and configure startup
pm2 save
pm2 startup systemd -u $(whoami) --hp $(eval echo ~$USER)
