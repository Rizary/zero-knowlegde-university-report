import { exportCallDataGroth16 } from "./snarkjsZkproof";

export async function merkleTreeCalldata(leaves) {
  const input = {
    leaves: leaves,
  };

  let dataResult;

  try {
    dataResult = await exportCallDataGroth16(
      input,
      "/zkproof/merkletree.wasm",
      "/zkproof/merkletree_0001.zkey"
    );
  } catch (error) {
    // console.log(error);
    window.alert("Wrong answer");
  }

  return dataResult;
}