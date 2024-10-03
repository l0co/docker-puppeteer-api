#!/usr/bin/env bash
set -x

pid=0

services_init() {
    if [ -f /bootstrap-init.sh ]; then
        echo "Initializing services..."
        /bootstrap-init.sh "$@"
        mv /bootstrap-init.sh /bootstrap-init.sh.executed
    fi
}

services_start() {
    echo "Starting services..."
    #service ssh start
    if [ -f /bootstrap-start.sh ]; then
        /bootstrap-start.sh "$@"
    fi
}

services_stop() {
    echo "Stopping services..."
    #service ssh stop
    if [ -f /bootstrap-stop.sh ]; then
        /bootstrap-stop.sh "$@"
    fi
}

# SIGTERM-handler
term_handler() {
    services_stop
    exit 143; # 128 + 15 -- SIGTERM
}

# setup handlers
# on callback, kill the last background process, which is `tail -f /dev/null` and execute the specified handler
trap 'kill ${!}; term_handler' SIGTERM

rm /var/run/*.pid
services_init
services_start

# wait forever
while true
do
  tail -f /dev/null & wait ${!}
done
