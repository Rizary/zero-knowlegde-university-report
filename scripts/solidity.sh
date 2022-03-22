
#!/bin/bash
# The script is to generate a solidity verifier that allows verifying proofs
# on Ethereum blockchain.

set -eu

# Check if circom is compiled or not
if [[ -z "${CIRCOM_OUT_DIR}" ]]; then
  echo 'Error: CIRCOM_OUT_DIR is not set. Please run `just compile-circom`' >&2
  exit 1
fi

export VERIFIER_SOLIDITY="$CIRCOM_OUT_DIR/verifier.sol"

# Exporting verifier to solidity
echo "🌟 Generating solidity verifier"
snarkjs zkey export solidityverifier $CIRCOM_ZKEY_AFT $VERIFIER_SOLIDITY
echo "----------------------------------------------------------------------------------------"

# # Copy the verifier to contract folder
# echo "🌟 Generating solidity verifier"
# cp $VERIFIER_SOLIDITY "$CIRCOM_PROJ_DIR/contract"
# echo "----------------------------------------------------------------------------------------"