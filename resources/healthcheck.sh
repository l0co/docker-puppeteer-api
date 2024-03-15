#!/usr/bin/env bash

wget -qO - 'http://localhost:8000/status' | grep '"status":"OK"' || exit 1
