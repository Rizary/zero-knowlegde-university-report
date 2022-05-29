# Show available commands
default:
  @just --list

# Show available commands
list:
  @just --list

alias help := default

circuit:
  just circuits/all-circom
  
contract-testnet:
  just contracts/deploy-harmony-testnet
  
contract-mainnet:
  just contracts/deploy-harmony-mainnet