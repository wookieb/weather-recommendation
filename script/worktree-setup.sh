#!/usr/bin/env bash
set -euo pipefail

yarn install
git submodule update --init ai-conventions/general
