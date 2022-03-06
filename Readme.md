# Zero-Knowledge University - Assignment 1

Welcome to my repository for any assignment on Zero-Knowledge University cohort March-April 2022.
This repository contains all of my attempt in completing the cohort by doing assignments given by the university.

This branch contains all of my attempt to finish the Assignment-1 which runs between 28 February 2022 to 7 March 2022.

## About the assignment

In this repository, the assignment focus on:
1. Intro to Circom
2. NFT and Merkle Tree
3. Ideas on ZK Technologies

## How to run

You will find all necessary command by typing `just list` and you'll see the following command:

```bash
$ just list
Available recipes:
    all             # run all command from compiling circom to generating proof and then verify it.
    a               # alias for `all`
    all-cleaned     # run all command after cleanup all output
    ac              # alias for `all-cleaned`
    clean-all       # clean all files in folder $CIRCOM_OUT_DIR and unset all environments
    clean-proof     # clean proof .json file
    clean-ptau      # clean .ptau files
    clean-zkey      # clean .zkey files
    compile-circom  # compile circom and store the result in the circom_out folder
    default         # Show available commands
    help            # alias for `default`
    export-solidity # generate a solidity verifier that allows verifying proofs on ethereum blockchain
    list            # Show available commands
    run-geth        # run geth on localhost
    run-phase2      # run phase2 for specific circuit
    run-proof       # generate a zk-proof associated to the circuit and the witness
    run-ptau        # preparing powers of tau ceremony and phase 2
    run-verify      # verifying the proof
```

Before you run the command, please make sure the following executables are already in your `$PATH` variables:
1. circom
2. just
3. snarkjs
4. node

If you want to compile and try `circom`, you can run `just all-circom`. run `just all-circom-cleaned` from a clean directory.

You can change the `CIRCOM_NAME` and `CIRCOM_PTAU_NUM` if you want to try another file or different power of tau number, and let `just` handle the rest.

## Disclaimer
Usually, we can put `circom_out` in our `.gitignore` file to avoid uploading unnecessary big size file. However, for submission purpose, I keep the folder for easier grading. Please note that the file `pot18_000.ptau` and `pot18_001.ptau` are removed due to unable to upload file larger than 50.00MB to GitHub.
    