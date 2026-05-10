#!/bin/sh
set -e
if [ -d /app/uploads ]; then
  chown -R node:node /app/uploads
fi
exec su-exec node "$@"
