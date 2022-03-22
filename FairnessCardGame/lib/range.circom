pragma circom 2.0.0;

/**
  Checks if a value is between the min and max value (inclusive)
*/
template Range(bits, min, max) {
  signal input in;

  component lowerBound = LessThan(bits);
  component upperBound = LessThan(bits);

  // in < 1 is false
  lowerBound.in[0] <== in;
  lowerBound.in[1] <== min;
  lowerBound.out === 0;

  // 13 < in is false
  upperBound.in[0] <== max;
  upperBound.in[1] <== in;
  upperBound.out === 0;
}