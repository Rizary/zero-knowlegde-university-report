#!/bin/bash
# The script is to preparing Powers of Tau ceremony
# that can be run before of after compiling the circom
# file.

set -eu

# We make sure that snarkjs is already installed
# in the PATH
if ! [ -x "$(command -v snarkjs)" ]; then
  echo 'Error: snarkjs is not installed.' >&2
  exit 1
fi

# Check if circom is compiled or not
if [[ -z "${CIRCOM_OUT_DIR}" ]]; then
  echo 'Error: CIRCOM_OUT_DIR is not set. Please run `just compile-circom`' >&2
  exit 1
fi

# First, we start a new "powers of tau" ceremony
echo "🌟 Starting a new power of tau ceremony"
snarkjs powersoftau new bn128 $CIRCOM_PTAU_NUM $CIRCOM_PTAU_FNAME -v
echo "----------------------------------------------------------------------------------------"

# Start contribution to the ceremony
echo "🌟 Contribution to the ceremony"
snarkjs powersoftau contribute $CIRCOM_PTAU_FNAME $CIRCOM_PTAU_FNAME_AFT --name="First contribution" -v -e="entropy"
echo "----------------------------------------------------------------------------------------"

# Verify the protocol
echo "🌟 Verifying the protocol"
snarkjs powersoftau verify $CIRCOM_PTAU_FNAME_AFT
echo "----------------------------------------------------------------------------------------"

# Preparing for phase 2
echo "🌟 Preparing phase 2"
snarkjs powersoftau prepare phase2 $CIRCOM_PTAU_FNAME_AFT $CIRCOM_PTAU_FNAME_FINAL -v
echo "----------------------------------------------------------------------------------------"

# Verify Powers of Tau final
echo "🌟 Verifying the final protocol"
snarkjs powersoftau verify $CIRCOM_PTAU_FNAME_FINAL
echo "----------------------------------------------------------------------------------------"
