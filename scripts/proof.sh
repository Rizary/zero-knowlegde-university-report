#!/bin/bash
# The script is to generate a zk-proof associated to the circuit and the witness after
# it is computed and the trusted setup is already executed.

set -eu

if [[ -z "${CIRCOM_OUT_DIR}" ]]; then
  echo 'Error: CIRCOM_OUT_DIR is not set. Please run `just compile-circom`' >&2
  exit 1
fi

# Check if circom is compiled or not
if [[ -z "${CIRCOM_ZKEY_AFT}" ]]; then
  echo 'Error: CIRCOM_ZKEY_AFT is not set. Please run `just run-phase2`' >&2
  exit 1
fi

# Generating the proof
echo "🌟 Generating proof using Groth16"
snarkjs groth16 prove $CIRCOM_ZKEY_AFT $CIRCOM_WITNESS $CIRCOM_PROOF $CIRCOM_PUBLIC
echo "----------------------------------------------------------------------------------------"

# Print the values of public inputs and outputs to the screen
echo "🌟 Values of public inputs and outputs"
cat $CIRCOM_PUBLIC
echo "----------------------------------------------------------------------------------------"
