pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/mimcsponge.circom";

// MiMCHash template will hash 2 leafs into 1 hashed output
template MiMCHash(n) {
    signal input values[n];
    signal output out;

    component mimc = MiMCSponge(n, 220, 1);
    mimc.k <== 0;
    for (var i = 0; i < n; i++) {
        mimc.ins[i] <== values[i];
    }

    out <== mimc.outs[0];
}

template MerkleTree(len) {
    signal input leaves[len];
    signal output out;
    
    // assert function checks whether the total element from the input is even
    // to avoid unbalanced tree.
    assert(len % 2 == 0);
    
    var k = 0;
    var hashesLength = 2 * len - 1;
    component hashes[hashesLength]; 
    for (var i = 0; i < hashesLength; i++) {
        if (i < len) {
            hashes[i] = MiMCHash(1);
            hashes[i].values[0] <== leaves[i];
        } else {
            hashes[i] = MiMCHash(2);
            hashes[i].values[0] <== hashes[k].out;
            hashes[i].values[1] <== hashes[k + 1].out;
            k += 2;
        }
    }

    out <== hashes[hashesLength - 1].out;
}

component main {public [leaves]} = MerkleTree(8);