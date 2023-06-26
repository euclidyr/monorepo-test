#!/usr/bin/env bash

NODE_OPTIONS=--max_old_space_size=8192 ./node_modules/.bin/jest \
  --config frontend/ts-migrate-extraz/scripts/jest-config-reignore.js \
  --json \
  --outputFile=tmp/ts-migrate-extraz-reignore-output.json \
  "$@"
