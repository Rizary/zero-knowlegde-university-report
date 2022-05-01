#!/bin/bash
# This file contain compilation process of circom
# until generating the witness file using WebAssembly

set -eu

# Check if circom is compiled or not
if [[ -z "${CIRCOM_NAME}" ]]; then
  echo 'Error: CIRCOM_NAME is not set. Please specify the circom filename in `just circom <filename>`' >&2
  exit 1
fi

# We make sure that circom is already installed
# in the PATH
if ! [ -x "$(command -v circom)" ]; then
  echo 'Error: circom is not installed.' >&2
  exit 1
fi

if ! [ -x "$(command -v node)" ]; then
  echo 'Error: node is not installed.' >&2
  exit 1
fi

# We use circom_out to make the project cleaner.
# This code make sure that we create folder called `circom_out`
# if it does not exist.
if [ ! -d $CIRCOM_PROJ_DIR/circom_out ]; then
    mkdir -p $CIRCOM_PROJ_DIR/circom_out;
fi;

# The first step is to compile the `.circom` file using circom command.
# As you noticed, the --output is there to make sure all the output from circom
# command goes straight to the circom_out folder.
echo "🌟 Compiling circom to circom_out folder"
circom $CIRCOM_PROJ_DIR/$CIRCOM_NAME.circom --r1cs --wasm --sym --c --output $CIRCOM_OUT_DIR
echo "----------------------------------------------------------------------------------------"

# We need to generate witness after compiling the circom file with the input.json
# taken from circom folder.
#
# The witness file contains set of inputs, intermediate signals and output
# echo "🌟 Computing witness using WebAssembly"
# node $CIRCOM_OUT_JS/generate_witness.js $CIRCOM_OUT_JS/$CIRCOM_NAME.wasm $CIRCOM_PROJ_DIR/circom/$CIRCOM_INPUT_NAME.json $CIRCOM_WITNESS
# echo "----------------------------------------------------------------------------------------"
