pragma circom 2.0.0;

// import mimcsponge.circom to get MiMCSponge template
include "mimcsponge.circom";

// MiMCHash template will hash 2 leafs into 1 hashed output
template MiMCHash(){
  signal input left;
  signal input right;
  signal output hash;

  component hashFunc = MiMCSponge(2, 220, 1);
  hashFunc.ins[0] <== left;
  hashFunc.ins[1] <== right;
  hashFunc.k <== 0;
  hash <== hashFunc.outs[0];
}

// Consturct MerkleTree with predefined input size -len-
//
template MerkleTree(len) {
    signal input leaves[len];
    signal output out;
    
    // assert function checks whether the total element from the input is even
    // to avoid unbalanced tree.
    assert(len % 2 == 0);
    var arrLength = 2 * len - 1;
    signal hashResult[arrLength];
    var subs = len;
    var l = 0;
    var r = 1;
    component singleHash[len];
    component doubleHash[arrLength];

    var i;
    // The first iteration is to hashed all input before
    // generating merkle tree
    for(i = 0; i < len; i++) {
            singleHash[i] = MiMCSponge(1,220,1);
            singleHash[i].ins[0] <== leaves[i];
            singleHash[i].k <== 0;
            hashResult[i] <== singleHash[i].outs[0];
    }
    // the second loop is to generate merkle tree based on
    // the hashed element from the first iteration
    for (i = 0; i < len - 1; i++) {
        doubleHash[i] = MiMCHash();
        doubleHash[i].left <== hashResult[l];
        doubleHash[i].right <== hashResult[r];
        hashResult[subs] <== doubleHash[i].hash;
        l+=2;
        r+=2;
        subs++;
    }
    out <== hashResult[arrLength - 2];
}

component main {public [leaves]} = MerkleTree(8);