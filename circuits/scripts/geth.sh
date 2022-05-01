#!/bin/bash

set -eu

PROJ_DIR=$(pwd)

# We make sure that geth is already installed
# in the PATH
if ! [ -x "$(command -v geth)" ]; then
  echo 'Error: geth is not installed.' >&2
  exit 1
fi

# Run geth locally with specific option.
# This option is the best I can get to start geth server.
geth --dev --identity "TestNet" --port 3000 --networkid 58343 --nodiscover --datadir=$PROJ_DIR/geth-data --maxpeers=0 --http --http.port 8543 --http.addr 127.0.0.1 --http.corsdomain "127.0.0.1" --http.api "eth,web3,debug,txpool,net,personal,admin,debug" --ws --ws.api "eth,web3,debug,txpool,net,personal,admin,debug" --ws.port 8546 --ws.addr 127.0.0.1 --ws.origins 127.0.0.1 --allow-insecure-unlock --cache 2048 --gcmode full