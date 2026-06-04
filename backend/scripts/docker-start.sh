#!/bin/sh
# Container entry: migrate (generate + central deploy), then start API.
set -eu

/app/scripts/docker-migrate.sh
exec node dist/main.js
