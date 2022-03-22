pragma circom 2.0.0;

include "../lib/bitify.circom";
include "../lib/mimcsponge.circom";
include "../lib/range.circom";

// This circuit verifies that the first card is a valid card.

template Main() {
  signal input c_value;
  signal input c_suite;
  signal input password;
  signal output c_value_hash;
  signal output c_suite_hash;
  signal output card;

  // verify card values are in proper range (1-13)
  component rp = Range(4, 1, 13);
  rp.in <== c_value;

  // verify that card suits are in proper range (1-4)
  component rp_suit = Range(4, 1, 4);
  rp_suit.in <== c_suite;

  component mimc_value = MiMCSponge(2, 220, 1);
  mimc_value.ins[0] <== c_value;
  mimc_value.ins[1] <== password;
  mimc_value.k <== 0;
  c_value_hash <== mimc_value.outs[0];

  component mimc_suit = MiMCSponge(2, 220, 1);
  mimc_suit.ins[0] <== c_suite;
  mimc_suit.ins[1] <== password;
  mimc_suit.k <== 0;
  c_suite_hash <== mimc_suit.outs[0];

  component mimc = MiMCSponge(2, 220, 1);
  mimc.ins[0] <== c_value_hash;
  mimc.ins[1] <== c_suite_hash;
  mimc.k <== 0;
  card <== mimc.outs[0];
}

component main = Main();