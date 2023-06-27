#!/usr/bin/env bash

NODE_OPTIONS=--max_old_space_size=8192 ./node_modules/.bin/jest \
  --config frontend/@euclidyr/ts-migrate-extra/scripts/jest-config-reignore.js \
  --json \
  --outputFile=tmp/@euclidyr/ts-migrate-extra-reignore-output.json \
  "$@"
