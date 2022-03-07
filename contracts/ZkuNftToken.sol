//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

// This is the main contract of NFT assignment. This ZkuNFTContract is based
// on ERC721URIStorage and Ownable to make sure safe and secure contract is created.
contract ZkuNFTContract is ERC721URIStorage, Ownable {
    using Strings for uint256;
    string public uriPrefix = "";
    string public uriSuffix = ".json";
    using Counters for Counters.Counter;
    Counters.Counter private _tokenId;

    constructor() ERC721("ZkuNftToken", "ZNT") {}

    // The mint function is used to mint NFT and give the result to this function caller.
    // Once the NFT is minted, this function will hashed the relevant information and 
    // then update the transaction using MerkleTree's `updateTransaction`.
    function mint(address _merkleTree) public payable {
        _tokenId.increment();
        uint256 newTokenID = _tokenId.current();
        string memory _tokenURI = this.tokenURI();
        _safeMint(_msgSender(), newTokenID);
        bytes32 newLeaf = keccak256(abi.encodePacked(_msgSender(), _msgSender(), newTokenID, _tokenURI));
        MerkleTree(_merkleTree).updateTransaction(newLeaf);
        MerkleTree(_merkleTree).generateTree();

    }

    // we call MerkleTree to move the simple getRoot() and be available in this file.
    function getMerkleRoot(address _merkleTree) external view returns (bytes32 root) {
        root = MerkleTree(_merkleTree).getRoot();
    }
  
    // mintForAddress is used by contract owner to mint an NFT address and
    // send it to the destination address.
    function mintForAddress(address _merkleTree, address _receiver) public onlyOwner {
        _tokenId.increment();
        uint256 newTokenID = _tokenId.current();
        string memory _tokenURI = this.tokenURI();
        _safeMint(_receiver, newTokenID);
        bytes32 newLeaf = keccak256(abi.encodePacked(_msgSender(), _receiver, newTokenID, _tokenURI));
        MerkleTree(_merkleTree).updateTransaction(newLeaf);
        MerkleTree(_merkleTree).generateTree();
    }

    // TokenURI is the custom function to generate TokenURI on-chain and having the name
    // and description attached to it.
    function tokenURI() public view virtual returns (string memory) {
        uint256 tokenId = _tokenId.current();
        bytes memory dataURI = abi.encodePacked(
            "{",
                '"name": "ZkuNftToken #', tokenId.toString(), '",',
                '"description": "NFT Token for ZKU students around the world"',
            "}"
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(dataURI)
            )
        );
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return uriPrefix;
    }
}

// MerkleTree contract is the base contract to create MerkleTree based on
// the elements of leaves array. 
contract MerkleTree {
    bytes32[] public leaves;
    bytes32[] trx;
    bytes32 root;
    bytes32 newLeaf;

    // generateTree() is the function where Merkle Tree is generated. It walk through the 
    // array of leaves and hash two element at the same time. The final result will be
    // in the latest array, that is why we assigned the latest root like the following.
    function generateTree() external {
        uint n = trx.length;
        uint offset = 0;

        while (n > 0) {
            for (uint i = 0; i < n - 1; i += 2) {
                leaves.push(
                    keccak256(
                        abi.encodePacked(leaves[offset + i], leaves[offset + i + 1])
                    )
                );
            }
            offset += n;
            n = n / 2;
        }
        root = leaves[leaves.length - 1];
    }

    // root is a stateful variable, so to get the latest state of root,
    // getRoot() function is created.
    function getRoot() external view returns (bytes32 result) {
        result = root;
    }
    // updateTransaction is the function to insert the new minted nft 
    // (we called a transaction) before generating Merkle Tree.
    //
    // This function works by recreating an empty array of leaves 
    // everytime this function is called. So instead of modifying the array
    // of leaves, the update function is tracking the transaction from another
    // array and push it into the empty leaves.
    function updateTransaction(bytes32 _transaction) external {
        trx.push(_transaction);
        delete leaves;
        for (uint i = 0; i < trx.length; i++) {
            leaves.push(keccak256(abi.encodePacked(trx[i])));
        }
        if (leaves.length % 2 != 0) {
            leaves.push(keccak256(abi.encodePacked(trx[trx.length - 1])));
        }
    }
}
