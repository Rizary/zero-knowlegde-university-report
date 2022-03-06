#!/bin/bash
# The script is to start phase 2 of circuit specific.
# The input will be the R1CS file in the circom_out directory.

set -eu

if [[ -z "${CIRCOM_OUT_DIR}" ]]; then
  echo 'Error: CIRCOM_OUT_DIR is not set. Please run `just compile-circom`' >&2
  exit 1
fi

if [[ -z "${CIRCOM_NAME}" ]]; then
  echo 'Error: CIRCOM_NAME is not set. Please run `just compile-circom`' >&2
  exit 1
fi

# Check if circom is compiled or not
if [[ -z "${CIRCOM_PTAU_FNAME_FINAL}" ]]; then
  echo 'Error: CIRCOM_PTAU_FNAME_FINAL is not set. Please run `just run-ptau`' >&2
  exit 1
fi

# Phase 2 start with generating a `.zkey` file that will contain the proving and verification keys together with all phase 2 contributions.
echo "🌟 Starting a new power of tau ceremony"
snarkjs groth16 setup $CIRCOM_OUT_DIR/$CIRCOM_NAME.r1cs $CIRCOM_PTAU_FNAME_FINAL $CIRCOM_ZKEY
echo "----------------------------------------------------------------------------------------"

# Contribute to phase 2 of the ceremony using the generated zkey.
echo "🌟 Contribute to phase 2 of the ceremony"
snarkjs zkey contribute $CIRCOM_ZKEY $CIRCOM_ZKEY_AFT --name="1st Contributor Name" -v -e="another entropy"
echo "----------------------------------------------------------------------------------------"

# Exporting the verification key for proof step.
echo "🌟 Exporting the verification key"
snarkjs zkey export verificationkey $CIRCOM_ZKEY_AFT $VERIFICATION_ZKEY
echo "----------------------------------------------------------------------------------------"
