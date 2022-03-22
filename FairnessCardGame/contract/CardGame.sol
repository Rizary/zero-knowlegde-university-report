// contracts/CardGame.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./verifier.sol";

contract CardGame {
    Verifier private verifier;

    mapping(address => bool) initPlayer;
    mapping(address => uint256[]) playerCards;

    constructor(address verifierContractAddress) {
        verifier = Verifier(verifierContractAddress);
    }

    modifier initializedPlayer() {
        require(
            initPlayer[msg.sender] == true,
            "Player is not initialized yet"
        );
        _;
    }

    function initlializePlayer(
        uint256[2] memory _a,
        uint256[2][2] memory _b,
        uint256[2] memory _c,
        uint256[3] memory _input
    ) public returns (bool) {
        // verify proof
        require(
            verifier.verifyInitProof(_a, _b, _c, _input),
            "Failed init proof check"
        );
        // set player as initialized
        initPlayer[msg.sender] = true;
        // save circuit output as player's first card
        uint256 card = _input[2]; // hash of card is at index 2
        playerCards[msg.sender].push(card); // store card's hash on-chain
        return true;
    }

    function drawCard(
        uint256[2] memory _a,
        uint256[2][2] memory _b,
        uint256[2] memory _c,
        uint256[3] memory _input
    ) public initializedPlayer returns (bool) {
        // verify proof
        require(
            verifier.verifyDrawProof(_a, _b, _c, _input),
            "Failed draw proof check"
        );
        uint256 card = _input[2];
        // check if player spoofed first card as second card
        // require hash2 is not equal to hash1
        require(
            playerCards[msg.sender][playerCards[msg.sender].length - 1] != card,
            "Duplicate of previous card"
        );
        // save circuit as player's second card
        playerCards[msg.sender].push(card); // store card's hash on-chain
        return true;
    }

    function getPlayerCards() public view returns (uint256[] memory) {
        return playerCards[msg.sender];
    }
}
