pragma circom 2.0.0;

include "../lib/bitify.circom";
include "../lib/mimcsponge.circom";
include "../lib/range.circom";

// the circuit verifies if card1 and card2 is in the same suit

template Main() {
  signal input c_val1;
  signal input c_suite1;
  signal input c_val2;
  signal input c_suite2;
  signal input password;
  signal output c_val_hash;
  signal output c_suite_hash;
  signal output card;

  // verify card values are in proper range (1-13)
  component rp1 = Range(32, 1, 13);
  rp1.in <== c_val1;

  component rp2 = Range(32, 1, 13);
  rp2.in <== c_val2;

  // verify that card suits are in proper range (1-4)
  component rp_suit1 = Range(32, 1, 4);
  rp_suit1.in <== c_suite1;

  component rp_suit2 = Range(32, 1, 4);
  rp_suit2.in <== c_suite2;

  // hash c_val1 and c_suite1, and compare if it is 
  // equal to hash of c_val1 and c_suite2
  // if it is, they are of the same suit
  signal card1;
  component mimc1 = MiMCSponge(2, 220, 1);
  mimc1.ins[0] <== c_val1;
  mimc1.ins[1] <== c_suite1;
  mimc1.k <== password;
  card1 <== mimc1.outs[0];

  signal card1_2;
  component mimc1_2 = MiMCSponge(2, 220, 1);
  mimc1_2.ins[0] <== c_val1;
  mimc1_2.ins[1] <== c_suite2;
  mimc1_2.k <== password;
  card1_2 <== mimc1_2.outs[0];

  card1 === card1_2;

  // card is from the same suit, 
  // we hash card2 data and use for commitment
  component mimc_value = MiMCSponge(2, 220, 1);
  mimc_value.ins[0] <== c_val2;
  mimc_value.ins[1] <== password;
  mimc_value.k <== 0;
  c_val_hash <== mimc_value.outs[0];

  component mimc_suit = MiMCSponge(2, 220, 1);
  mimc_suit.ins[0] <== c_suite2;
  mimc_suit.ins[1] <== password;
  mimc_suit.k <== 0;
  c_suite_hash <== mimc_suit.outs[0];

  component mimc = MiMCSponge(2, 220, 1);
  mimc.ins[0] <== c_val_hash;
  mimc.ins[1] <== c_suite_hash;
  mimc.k <== 0;
  card <== mimc.outs[0];
}

component main = Main();