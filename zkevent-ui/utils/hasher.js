import { buildPedersenHash } from "circomlibjs";
import { BigNumber } from "ethers";
import { randomBytes } from "ethers/lib/utils";
const { utils } = require("ffjavascript");
const { leBuff2int, leInt2Buff } = utils;

export class PoseidonHasher {
  constructor(poseidon) {
    this.poseidon = poseidon;
  }

  hash(left, right) {
    const hash = this.poseidon([left, right]);
    return BigNumber.from(this.poseidon.F.toString(hash));
  }
}

/** Generate random number of specified byte length */
export const rbigint = (nbytes) => leBuff2int(randomBytes(nbytes))

/** BigNumber to hex string of specified length */
// export const toHex = (number, length = 32) =>
//     (number instanceof Buffer ? number.toString('hex') : BigNumber.from(number).toHexString()).padStart(length * 2, '0')
export function toHex(number, length = 32) {
    const result = (number instanceof Buffer ? number.toString('hex') : BigNumber.from(number).toHexString()).padStart(length * 2, '0')
        //number instanceof Buffer ? number.toString('hex') : BigInt(number).toString(16)
    return result
}
  
/** Compute pedersen hash */
export function pedersenHashCompute(data) {
    return buildPedersenHash()
        .then(pedersen => {
            const h = pedersen.hash(data);
            const hP = pedersen.babyJub.unpackPoint(h);
            return {
                // "hash": leBuff2int(h),
                "pedersenBits": pedersen.buffer2bits(data),
                "pedersenResult": toHex(pedersen.babyJub.F.toObject(hP[0])),
                // "oneObject": pedersen.babyJub.F.toObject(hP[1]),
                // "zero": leBuff2int(hP[0]),
                // "one": leBuff2int(hP[1])
            }
        }).catch( error => console.log(error))
}

/**
 * Create commitment object from secret and nullifier
 */
 export async function createCommitment(nullifier, secret) {
    let commitment = { nullifier, secret }
    commitment.preimage = Buffer.concat([
        leInt2Buff(BigNumber.from(commitment.nullifier).toBigInt(), 31),
        leInt2Buff(BigNumber.from(commitment.secret).toBigInt(), 31)
    ]);
    commitment.commitment = await pedersenHashCompute(commitment.preimage);
    commitment.nullifierHash = await pedersenHashCompute(leInt2Buff(BigNumber.from(commitment.nullifier).toBigInt(), 31));
    return commitment
 }
  
 
 