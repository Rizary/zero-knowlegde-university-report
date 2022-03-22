pragma circom 2.0.0;

include "../lib/bitify.circom";
include "../lib/mimcsponge.circom";
include "../lib/comparators.circom";


// This circuit try to verify that A->B->C is valid by doing:
// 1. Check if A->B->C move is a triangle.
// 2. Check that the move A->B and B->C distance is within the energy bounds

// Check that the player has sufficient energy to jump between A->B and B->C
template Jump() {
  signal input x1;
  signal input y1;
  signal input x2;
  signal input y2;
  signal input energy;
  signal output out;

  signal diffX;
  diffX <== x1 - x2;
  signal diffY;
  diffY <== y1 - y2;

  signal diffXSq;
  diffXSq <== diffX * diffX;
  signal diffYSq;
  diffYSq <== diffY * diffY;
  
  component less_than = LessEqThan(32);
  less_than.in[0] <== diffXSq + diffYSq;
  less_than.in[1] <== energy * energy;
  out <== less_than.out;
}

template Main() {
  signal input x1;
  signal input y1;
  signal input x2;
  signal input y2;
  signal input x3;
  signal input y3;

  signal input energy;
  
  signal output is_move_allowed;


  // The A->B->C move should be part of triangle, whereas
  // x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2) > 0
  // if the area is zero, then it is not a triangle
  component is_zero = IsZero(); 
  signal a1;
  a1 <== x1 * (y2 - y3);

  signal a2;
  a2 <== x2 * (y3 - y1);
  
  signal a3;
  a3 <== x3 * (y1 - y2);
  is_zero.in <== a1 + a2 + a3;
  
  // check whether it is a triangle or not
  signal is_triangle;
  is_triangle <== 1 - is_zero.out;
  assert(is_triangle === 1);

  // Check that the move A->B distance is within the energy bounds
  component jump_atob = Jump();
  jump_atob.x1 <== x1;
  jump_atob.y1 <== y1;
  jump_atob.x2 <== x2;
  jump_atob.y2 <== y2;
  jump_atob.energy <== energy;
  assert(jump_atob.out == 1);

  // Check that the move B->C distance is within the energy bounds
  component jump_btoc = Jump();
  jump_btoc.x1 <== x2;
  jump_btoc.y1 <== y2;
  jump_btoc.x2 <== x3;
  jump_btoc.y2 <== y3;
  jump_btoc.energy <== energy;
  assert(jump_btoc.out == 1);

  signal is_valid1;
  is_valid1 <== is_triangle;
  signal is_valid2;
  is_valid2 <== jump_atob.out * jump_btoc.out;

  is_move_allowed <== is_valid1 * is_valid2;
  assert(is_move_allowed === 1);
  
  // hash the new location coordinates (point C) to store as commitment
  component mimc = MiMCSponge(2, 220, 1);
  mimc.ins[0] <== x3;
  mimc.ins[1] <== y3;
  mimc.k <== 0;
  new_location <== mimc.outs[0];
  
}

component main {public [energy]}  = Main();