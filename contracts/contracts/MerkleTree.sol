//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract MerkleTree {
    // Merkle Tree
    bytes32[] public data;

    // current index leaves
    uint256 index;

    // Merkle Tree leaves
    bytes32[] public leaves;

    constructor(uint256 leavesLength) {
        uint256 size = 2 * leavesLength - 1;
        index = leavesLength - 1;
        for (uint256 i = 0; i < size; i++) {
            data.push(keccak256(abi.encodePacked("0")));
        }
        for (uint256 i = index; i < size; i++) {
            leaves.push(data[i]);
        }
    }

    // Get the entire Merkle tree
    function getData() public view returns (bytes32[] memory) {
        return data;
    }

    // Returns the parent of a node
    function takeParent(uint256 pos) internal pure returns (uint256) {
        return (pos - 1) / 2;
    }

    // Returns the left child of a node
    function takeLeftChild(uint256 pos) internal pure returns (uint256) {
        return 2 * pos + 1;
    }

    // Returns the right child of a node
    function takeRightChild(uint256 pos) internal pure returns (uint256) {
        return 2 * pos + 2;
    }

    // Returns if a number is even
    function isEvenNumber(uint256 number) internal pure returns (bool) {
        if (number % 2 == 0) {
            return true;
        }
        return false;
    }

    // Update the Merkle tree
    function updateMerkleTree(uint256 pos) internal {
        uint256 currentPos = pos;
        uint256 parentPos;
        uint256 siblingPos;
        while (currentPos != 0) {
            parentPos = takeParent(currentPos);
            if (isEvenNumber(currentPos)) {
                siblingPos = takeLeftChild(parentPos);
            } else {
                siblingPos = takeRightChild(parentPos);
            }
            data[parentPos] = keccak256(
                abi.encodePacked(data[currentPos], data[siblingPos])
            );
            currentPos = parentPos;
        }
    }

    // Add new data to the Merkle tree
    function addData(string memory elem) public {
        require(index < data.length, "The Merkle Tree is already full");
        bytes32 computedHash = keccak256(abi.encodePacked(elem));
        data[index] = computedHash;
        leaves[index - (leaves.length - 1)] = computedHash;
        updateMerkleTree(index);
        index++;
    }

    // Returns the leaves of the Merkle tree
    function getLeaves() public view returns (bytes32[] memory) {
        return leaves;
    }
}