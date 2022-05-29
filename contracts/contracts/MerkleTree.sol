// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IPoseidonHasher {
    function poseidon(uint256[2] calldata inputs) external pure returns (uint256);
}

contract MerkleTree {
    uint256 public constant FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // keccak256("zkevent")
    uint256 public constant ZERO_VALUE = 69945165117389948066239568081889149499937967651269989002132173313232931521957;
    uint256 public constant ROOT_HISTORY_SIZE = 100;

    IPoseidonHasher public immutable hasher;

    uint256 public levels;
    uint32 public immutable maxSize;

    uint32 public index = 0;
    mapping(uint256 => uint256) public levelHashes;
    mapping(uint256 => uint256) public roots;
    
    // Merkle Tree leaves
    uint256[] public leaves;

    constructor(uint256 _levels, address _hasher) {
        require(_levels > 0, "_levels should be greater than 0");
        require(_levels <= 32, "_levels should not be greater than 32");
        levels = _levels;
        hasher = IPoseidonHasher(_hasher);
        maxSize = uint32(2) ** levels;

        for (uint256 i = 0; i < _levels; i++) {
            levelHashes[i] = zeros(i);
        }
    }

    function insert(uint256 leaf) public returns (uint32) {
        require(index != maxSize, "Merkle tree is full");
        require(leaf < FIELD_SIZE, "leaf greater than FIELD_SIZE");
        leaves.push(leaf);
        uint32 currentIndex = index;
        uint256 currentLevelHash = leaf;
        uint256 left;
        uint256 right;

        for (uint256 i = 0; i < levels; i++) {
            if (currentIndex % 2 == 0) {
                left = currentLevelHash;
                right = zeros(i);
                levelHashes[i] = currentLevelHash;
            } else {
                left = levelHashes[i];
                right = currentLevelHash;
            }

            currentLevelHash = hasher.poseidon([left, right]);
            currentIndex /= 2;
        }

        roots[index % ROOT_HISTORY_SIZE] = currentLevelHash;

        index++;
        return index - 1;
    }

    function isValidRoot(uint256 root) public view returns (bool) {
        if (root == 0) {
            return false;
        }

        uint256 currentIndex = index % ROOT_HISTORY_SIZE;
        uint256 i = currentIndex;
        do {
            if (roots[i] == root) {
                return true;
            }

            if (i == 0) {
                i = ROOT_HISTORY_SIZE;
            }
            i--;
        }
        while (i != currentIndex);

        return false;
    }
    
    // Returns the leaves of the Merkle tree
    function getLeaves() public view returns (uint256[] memory) {
        return leaves;
    }
    
    function getZero() public view returns (uint256) {
        return ZERO_VALUE;
    }

    /// @dev provides Zero (Empty) elements for a Poseidon MerkleTree. Up to 32 levels
  function zeros(uint256 i) public pure returns (uint256) {
    if (i == 0) return uint256(0x9aa38f7ea48808686649fa7880b9399d9e535a0a95a359acf706c433259205a5);
    else if (i == 1) return uint256(0x2c29b53ae2a7e149da1910c2b1c9a78f003db2bd5520f50ce8c74bdcdb568012);
    else if (i == 2) return uint256(0x0a4b737194779f9b1d0b8442e12967e17efaa0da5da8e5392f4b06dfaa24ee0a);
    else if (i == 3) return uint256(0x17a15d9ebc5471bbaefd7e16a461f7c6fd079e5a5aacaf8509784a1993c14756);
    else if (i == 4) return uint256(0x2b5d98f30dd5369771a77e039bdd9d996922ac099439950ef6406fd2aabc9c57);
    else if (i == 5) return uint256(0x0d59bdeb4a9fc11991f6830096928757e2adf7335afe03f399f3bdfa43ccb380);
    else if (i == 6) return uint256(0x2e40730cf574ab677beddcae49bbfd7ae30dc22fbac0e3d6b70e1981f817f0d2);
    else if (i == 7) return uint256(0xd8d77c1fbf6f21c7d1f159e06569e3c5c1042e9a6925cf2ad0b1007ccccd89);
    else if (i == 8) return uint256(0x2cbf870c4e6a2ddb731f85eadcaaaa02930a0555b098f327b01b090fc02a13dc);
    else if (i == 9) return uint256(0x2770813b76848f0d85832877d7964451059aedf7708e94ace835a41c5c5c3032);
    else if (i == 10) return uint256(0x1b38a24ed681bab435fd89fcd6a2c33979dfbd218a191b5a01e25bcb7b64a180);
    else if (i == 11) return uint256(0x2ebd6f1f05c73f3cf702a8a2785f9fe1efabca48231e1802abd6082b3eb25ada);
    else if (i == 12) return uint256(0x2946bbd452c25d6be385a02c5c927ef6a53b38df11881dde66d1456780f426a2);
    else if (i == 13) return uint256(0x2947dbd4f961187b14843603c3e9d5ab714cb152e4e32ffc217c25a1317c004d);
    else if (i == 14) return uint256(0x2293fdc6cb52ee2d0924f1162a01bb6d9d4c8e4f79df10783ca5db324cde350c);
    else if (i == 15) return uint256(0x1cdb4e135280f46adfd41ca0446ca39e4c98a473eceb23dfae87e34375d7376c);
    else if (i == 16) return uint256(0x18ce6e88feb516cc12f16134f831a3bc8bb2327e7d9217672acfb9e998c66620);
    else if (i == 17) return uint256(0x196c9160fa69c6e80c102f080a77516efc9b1c80efbd43a05c92d4a052ec5d04);
    else if (i == 18) return uint256(0x0d3b32f031ce74a359b30a566a8b2f4a0bcd12062a73dd7dc98987e284e9b174);
    else if (i == 19) return uint256(0x29937bf28bbad002267775c58ec5a25517a47d5e984051befc6adca6bf6077af);
    else if (i == 20) return uint256(0x16fbcfecac3a8080879dfd5d8e5396cfd45318d6b6365422d248a80d4709dfd3);
    else if (i == 21) return uint256(0x2ba87097790da4a18c2a648daf6a914dc40a77027e4f4d006b86689745f1f904);
    else if (i == 22) return uint256(0x1589f8abfbdc2b1c2f37ed59fec56ea1abf13ed4c35e19dab00ab6f06d5f5f94);
    else if (i == 23) return uint256(0x13245464d7bb21db64edc07abf62aba1aff095c5cb7d82eff1064174940c03aa);
    else if (i == 24) return uint256(0x1a5bf36afaf568ba9574f0ec3c123d517d75df791ce8b5b613695f920fb3c526);
    else if (i == 25) return uint256(0x23a071ff50383563ee5a0fda1c94b695f38555523ba98d8d6bdb601fdc0f1ad2);
    else if (i == 26) return uint256(0x1e251c6adf83e1f386ae2680c758793d43f7567a61ef1cd8ad4281eac303e6ba);
    else if (i == 27) return uint256(0x1da0cd96dea8bf9eb38b9dd35178ae22fa2aad2980d4daedf71945c2b48c82bf);
    else if (i == 28) return uint256(0x1d5f2f09d80a285e49e77e785802bb2f67bafca2e2a97fc1eab680437efc938f);
    else if (i == 29) return uint256(0x108d602bea7929a7708f0e5622f9a08575f3be7becf0afb4bc03f90b4ed8f945);
    else if (i == 30) return uint256(0x300d01d67029ba619a9e9ef07f256bc7001f41305cbbeeb759222123761d3be5);
    else if (i == 31) return uint256(0x1a8a6c4eefd81a332654811be806161e3b3b50219a14d2d36ecd8b213a3455da);
    else if (i == 32) return uint256(0x1865f912dd1273fb75972d72cca10055c6e3b529e36aa8c8ef67698a42727dfe);
    else revert("Index out of bounds");
  }
}