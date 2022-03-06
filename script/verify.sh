#!/bin/bash
# The script is verify the proof. 
# If the proof is valid, the command outputs an `OK`.

set -eu

# Check if circom is compiled or not
if [[ -z "${CIRCOM_PUBLIC}" ]]; then
  echo 'Error: CIRCOM_PUBLIC is not set. Please run `just run-proof`' >&2
  exit 1
fi

# Check if circom is compiled or not
if [[ -z "${VERIFICATION_ZKEY}" ]]; then
  echo 'Error: VERIFICATION_ZKEY is not set. Please run `just run-phase2`' >&2
  exit 1
fi

# Generating the proof
echo "🌟 Generating proof using Groth16"
snarkjs groth16 verify $VERIFICATION_ZKEY $CIRCOM_PUBLIC $CIRCOM_PROOF
echo "----------------------------------------------------------------------------------------"
