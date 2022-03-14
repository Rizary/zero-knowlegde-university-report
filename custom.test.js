const hre = require('hardhat')
const { ethers, waffle } = hre
const { loadFixture } = waffle
const { expect } = require('chai')
const { utils } = ethers

const { poseidonHash2, toFixedHex } = require('../src/utils')
const Utxo = require('../src/utxo')
const { transaction, registerAndTransact, prepareTransaction, buildMerkleTree } = require('../src/index')
const { Keypair } = require('../src/keypair')
const { encodeDataForBridge } = require('./utils')

const MERKLE_TREE_HEIGHT = 5
const l1ChainId = 1
const MINIMUM_WITHDRAWAL_AMOUNT = utils.parseEther(process.env.MINIMUM_WITHDRAWAL_AMOUNT || '0.05')
const MAXIMUM_DEPOSIT_AMOUNT = utils.parseEther(process.env.MAXIMUM_DEPOSIT_AMOUNT || '1')
const MerkleTree = require('fixed-merkle-tree')

describe('Custom Test', () => {

    async function deploy(contractName, ...args) {
      const Factory = await ethers.getContractFactory(contractName)
      const instance = await Factory.deploy(...args)
      return instance.deployed()
    }
  
    async function fixture() {
        require('../scripts/compileHasher')
        const [sender, gov, l1Unwrapper, multisig] = await ethers.getSigners()
        const verifier2 = await deploy('Verifier2')
        const verifier16 = await deploy('Verifier16')
        const hasher = await deploy('Hasher')
    
        const token = await deploy('PermittableToken', 'Wrapped ETH', 'WETH', 18, l1ChainId)
        await token.mint(sender.address, utils.parseEther('10000'))
    
        const amb = await deploy('MockAMB', gov.address, l1ChainId)
        const omniBridge = await deploy('MockOmniBridge', amb.address)
    
        /** @type {TornadoPool} */
        const tornadoPoolImpl = await deploy(
          'TornadoPool',
          verifier2.address,
          verifier16.address,
          MERKLE_TREE_HEIGHT,
          hasher.address,
          token.address,
          omniBridge.address,
          l1Unwrapper.address,
          gov.address,
          l1ChainId,
          multisig.address,
        )
    
        const { data } = await tornadoPoolImpl.populateTransaction.initialize(
          MINIMUM_WITHDRAWAL_AMOUNT,
          MAXIMUM_DEPOSIT_AMOUNT,
        )
        const proxy = await deploy(
          'CrossChainUpgradeableProxy',
          tornadoPoolImpl.address,
          gov.address,
          data,
          amb.address,
          l1ChainId,
        )
    
        const tornadoPool = tornadoPoolImpl.attach(proxy.address)
    
        await token.approve(tornadoPool.address, utils.parseEther('10000'))
    
        const merkleTreeWithHistory = await deploy(
          'MerkleTreeWithHistoryMock',
          MERKLE_TREE_HEIGHT,
          hasher.address,
        )
        await merkleTreeWithHistory.initialize()
    
        return { hasher, merkleTreeWithHistory, tornadoPool, token, proxy, omniBridge, amb, gov, multisig }
    }
    it('Estimate Gas, Deposit and Withdraw Ether', async () => {
        // load the fixture needed for the test
        const { merkleTreeWithHistory, tornadoPool, token, omniBridge } = await loadFixture(fixture)
        
        // We estimate and print gas needed for inserting pair of leaves to MerkleTreeWithHistory
        const gas = await merkleTreeWithHistory.estimateGas.hashLeftRight(toFixedHex(123), toFixedHex(456))
        console.log('hasher gas', gas - 21000)

        // Alice deposits 0.08 ETH into tornado pool (L1)
        const aliceKeypair = new Keypair() // contains private and public keys
        const aliceDepositAmount = utils.parseEther('0.08')
        const aliceDepositUtxo = new Utxo({ amount: aliceDepositAmount, keypair: aliceKeypair })
        const { args, extData } = await prepareTransaction({
          tornadoPool,
          outputs: [aliceDepositUtxo],
        })
    
        const onTokenBridgedData = encodeDataForBridge({
          proof: args,
          extData,
        })
    
        const onTokenBridgedTx = await tornadoPool.populateTransaction.onTokenBridged(
          token.address,
          aliceDepositUtxo.amount,
          onTokenBridgedData,
        )
        // emulating bridge. first it sends tokens to omnibridge mock then it sends to the pool
        await token.transfer(omniBridge.address, aliceDepositAmount)
        const transferTx = await token.populateTransaction.transfer(tornadoPool.address, aliceDepositAmount)
    
        await omniBridge.execute([
          { who: token.address, callData: transferTx.data }, // send tokens to pool
          { who: tornadoPool.address, callData: onTokenBridgedTx.data }, // call onTokenBridgedTx
        ])
    
        // Alice withdraw 0.05 ETH in L2
        // withdraws a part of his funds from the shielded pool
        const aliceWithdrawAmount = utils.parseEther('0.05')
        const recipient = '0xDeaD00000000000000000000000000000000BEEf'
        const aliceChangeUtxo = new Utxo({
          amount: aliceDepositAmount.sub(aliceWithdrawAmount),
          keypair: aliceKeypair,
        })
        await transaction({
          tornadoPool,
          inputs: [aliceDepositUtxo],
          outputs: [aliceChangeUtxo],
        recipient: recipient,
          // set to false so that Alice withdrawing to L2
          isL1Withdrawal: false,
        })
    
        // We are asserting all recipient, omniBridge, and tornadoPool balances are correct
        // Alice withdrew 0.05 ETH, so recipient should have a balance of 0.05 ETH
        const recipientBalance = await token.balanceOf(recipient)
        expect(recipientBalance).to.be.equal(utils.parseEther('0.05'))
        // Omnibridge should not have any ETH, since it only bridges the tokens
        const omniBridgeBalance = await token.balanceOf(omniBridge.address)
        expect(omniBridgeBalance).to.be.equal(0)
        // Alice should have 0.08-0.05=0.03 ETH balance in the tornado pool
        const tornadoPoolBalance = await token.balanceOf(tornadoPool.address)
        expect(tornadoPoolBalance).to.be.equal(utils.parseEther('0.03'))
    })
})