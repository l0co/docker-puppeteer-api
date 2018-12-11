#!/bin/bash

if [[ -f "/.node-pid" ]]; then
    echo "killing expressjs application width PID: `cat /.node-pid`"
    kill -9 `cat /.node-pid`
    rm /.node-pid
fi