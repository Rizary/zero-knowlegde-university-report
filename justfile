# Show available commands
default:
  @just --list

# Show available commands
list:
  @just --list

alias help := default

circuit:
  just circuits/build
  
contract-testnet:
  just contracts/deploy-harmony
  
contract-mainnet:
  just contracts/deploy-harmony-mainnet