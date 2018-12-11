#!/bin/bash

echo "starting expressjs application"
cd /root/puppeteer-api
node index.js &
echo $! > /.node-pid
echo "expressjs application started with PID: `cat /.node-pid`"
