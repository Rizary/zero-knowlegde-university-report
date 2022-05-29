pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/switcher.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/pedersen.circom";

template MerkleProof(levels) {

    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal input root;

    component switcher[levels];
    component hasher[levels];

    for (var i = 0; i < levels; i++) {
        switcher[i] = Switcher();
        switcher[i].L <== i == 0 ? leaf : hasher[i - 1].out;
        switcher[i].R <== pathElements[i];
        switcher[i].sel <== pathIndices[i];

        hasher[i] = Poseidon(2);
        hasher[i].inputs[0] <== switcher[i].outL;
        hasher[i].inputs[1] <== switcher[i].outR;
    }

    root === hasher[levels - 1].out;
}

// Computes Pedersen(nullifier + secret) hash
template CommitmentHasher() {
    signal input nullifier[248];
    signal input secret[248];
    signal output commitment;
    signal output nullifierHash;

    component commitmentHasher = Pedersen(496);
    component nullifierHasher = Pedersen(248);
    //component nullifierBits = Num2Bits(248);
    //component secretBits = Num2Bits(248);
    //nullifierBits.in <== nullifier;
    //secretBits.in <== secret;
    for (var i = 0; i < 248; i++) {
        nullifierHasher.in[i] <== nullifier[i];
        commitmentHasher.in[i] <== nullifier[i];
        commitmentHasher.in[i + 248] <== secret[i];
    }
    commitment <== commitmentHasher.out[0];
    nullifierHash <== nullifierHasher.out[0];
}

// Verify commitment corresponds to secret/nullifier pair in merkle tree
template Withdraw(levels) {
    // Public inputs 
    signal input root; 
    signal input nullifierHash;
    signal input recipient; 

    // Private inputs
    signal input nullifier[248];
    signal input secret[248]; 
    signal input pathElements[levels]; 
    signal input pathIndices[levels]; 

    component hasher = CommitmentHasher();
    for (var i = 0; i < 248; i++) {
        hasher.nullifier[i] <== nullifier[i];
        hasher.secret[i] <== secret[i];
    }

    log(hasher.nullifierHash);
    log(hasher.commitment);

    hasher.nullifierHash === nullifierHash;


    component tree = MerkleProof(levels);
    tree.leaf <== hasher.commitment;
    tree.root <== root;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }

    // Squares used to prevent optimizer from removing constraints
    signal recipientSquare;
    recipientSquare <== recipient * recipient;
}

component main = Withdraw(16);