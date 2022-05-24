// Generates Hasher artifact at compile-time using external compilermechanism
// import { poseidonContract } from "circomlibjs";
// import fs from "fs";
// import * as path from "path";
const path = require('path')
const fs = require('fs')
const { poseidonContract } = require('circomlibjs')

const outputPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'PoseidonHasher.sol')
const outputFile = path.join(outputPath, 'PoseidonHasher.json')

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true })
}

const contract = {
  _format: 'hh-sol-artifact-1',
  contractName: 'PoseidonHasher',
  sourceName: 'contracts/PoseidonHasher.sol',
  abi: poseidonContract.generateABI(2),
  bytecode: poseidonContract.createCode(2),
  deployedBytecode: "",
  linkReferences: {},
  deployedLinkReferences: {},
}

fs.writeFileSync(outputFile, JSON.stringify(contract, null, 2))