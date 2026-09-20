#!/bin/bash
set -euo pipefail

export CI=true

pnpm install --frozen-lockfile
pnpm --filter @workspace/db run push-force
