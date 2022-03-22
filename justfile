#!/usr/bin/env just --justfile
# ^ A shebang isn't required, but allows a justfile to be executed
#   like a scripts, with `./justfile test`, for example.

# Set dotenv to true so just can find .env in the repository
# and load the environment variable.
set dotenv-load

# Export all the variable needed to run all circom related command.
# You can change CIRCOM_NAME and CIRCOM_PTAU_NUM for
# specific filename and number of power of tau
export CIRCOM_NAME := "FairnessCardGameInit"
export CIRCOM_INPUT_NAME := "input_init"
export CIRCOM_DIRNAME := "FairnessCardGame"
export CIRCOM_PTAU_NUM := "16"
export CIRCOM_PROJ_DIR := "./" + CIRCOM_DIRNAME
export CIRCOM_OUT_DIR := CIRCOM_PROJ_DIR + "/circom_out"
export CIRCOM_OUT_JS := CIRCOM_OUT_DIR + "/" + CIRCOM_NAME + "_js"
export CIRCOM_WITNESS := CIRCOM_OUT_DIR + "/witness.wtns"
export CIRCOM_PTAU_FNAME := CIRCOM_OUT_DIR + "/pot" + CIRCOM_PTAU_NUM + "_0000.ptau"
export CIRCOM_PTAU_FNAME_AFT := CIRCOM_OUT_DIR + "/pot" + CIRCOM_PTAU_NUM + "_0001.ptau"
export CIRCOM_PTAU_FNAME_FINAL := CIRCOM_OUT_DIR + "/pot" + CIRCOM_PTAU_NUM + "_final.ptau"
export CIRCOM_ZKEY:= CIRCOM_OUT_DIR + "/" + CIRCOM_NAME + "_0000.zkey"
export CIRCOM_ZKEY_AFT:= CIRCOM_OUT_DIR + "/" + CIRCOM_NAME + "_0001.zkey"
export VERIFICATION_ZKEY:= CIRCOM_OUT_DIR + "/" + "verification_key.json"
export CIRCOM_PROOF:= CIRCOM_OUT_DIR + "/" + "proof.json"
export CIRCOM_PUBLIC:= CIRCOM_OUT_DIR + "/" + "public.json"
export VERIFIER_SOLIDITY := CIRCOM_OUT_DIR + "/" + "verifier.sol"

# Export all the variable needed to run and deploy Solidity smart contract.
# If you do not see anything, then the variable is already in `.env` file that can be
# recognized by justfile which is not in the repository. Thus, please create
# `.env` file and put all the necessary variables mentioned in .env.example

alias ac := all-circom
alias acc := all-circom-cleaned

# Show available commands
default:
  @just --list

# Show available commands
list:
  @just --list

alias help := default

# run geth on localhost
run-geth:
    . ./scripts/geth.sh

# run all command from compiling circom to generating proof and then verify it.
all-circom: compile-circom run-ptau run-phase2 run-proof run-verify

# run all command after cleanup all output
all-circom-cleaned: clean-all all-circom 

# compile circom and store the result in the circom_out folder
compile-circom:
    ./scripts/circom.sh

# preparing powers of tau ceremony and phase 2
run-ptau:
    ./scripts/ptau.sh
    
# run phase2 for specific circuit
run-phase2:
    ./scripts/phase2.sh
    
# generate a zk-proof associated to the circuit and the witness
run-proof:
    ./scripts/proof.sh
    
# verifying the proof
run-verify:
    ./scripts/verify.sh

# generate a solidity verifier that allows verifying proofs on ethereum blockchain
export-solidity:
    ./scripts/solidity.sh

# clean .ptau files
clean-ptau:
    rm ./circom_out/*.ptau

# clean .zkey files
clean-zkey:
    rm ./circom_out/*.zkey
    
# clean proof .json file
clean-proof:
    rm ./circom_out/*.json

# clean all files in folder $CIRCOM_OUT_DIR and unset all environments
clean-all:
    #!/usr/bin/env bash
    rm -rf $CIRCOM_OUT_DIR
    # Check if circom is compiled or not
    if [[ -z "${CIRCOM_OUT_DIR}" ]]; then
        echo 'Cleanup All Environment' >&2
        ./scripts/clean_env.sh
    fi

# compile the solidity contract using hardhat
compile-contract:
    npx hardhat compile

# deploy the contract to the ropsten network
deploy-contract:
    npx hardhat run ./scripts/deploy.ts --network ropsten
    
# test the contract
test-contract $REPORT_GAS='0' $EXTENDED_TESTS='0':
    npx hardhat test