//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./MerkleTree.sol";

interface IVerifier {
    function verifyProof(
        bytes memory proof, 
        uint[] memory pubSignals
    ) external view returns (bool);
}

/** @title Event */
contract Event is ERC721URIStorage, Ownable {
    address public verifierAddr;
    string public evName;
    address public evOwner;
    uint256 public startDate;
    uint256 public endDate;
    uint256 public available;
    string public location;
    string public  description;
    string public imageHash;
    bool private canceled;
    uint public ticketPrice;
    
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    MerkleTree public merkleTreeAddress;
   
    event TicketPurchased(address purchaser, uint date, uint32 index, uint256 info, uint256 newItemId);
    event TicketTransfered(address _from, address _to, uint256 _tokenIds);
    event PaymentCollected(address _event, address _organizer, uint256 _balance);
    event TicketRefunded(address _event, address _requestedBy, uint256 _tokenIds, uint256 _ticketPrice);


    /**@dev created new instance of Event
    @param _organizer account address of event organizer creating the event 
    @param _name title of the event
    @param _start start date of event given in unix timestamp
    @param _end end date of event provided in unix timestamp
    @param _description extra description of the event
    @param _location event location
    @param supply available tickets for sell to the event
    @param _ticketPrice ticket price in wei
    */

    constructor(address _organizer, 
    string memory _name, 
    uint _start, 
    uint _end,
    string memory _description,  
    string memory _location,
    uint supply, 
    uint _ticketPrice,
    address _verifierAddr,
    address _hasherAddr
    ) ERC721(_name, "ZKEV") public {

        evName = _name;
        startDate = _start;
        endDate = _end;
        ticketPrice = _ticketPrice;
        available = supply;
        description = _description;
        evOwner = _organizer;
        location = _location;
        
        require(supply < 17, "ticket supply should be less than 16");
        merkleTreeAddress = new MerkleTree(supply, _hasherAddr);
        
        verifierAddr = _verifierAddr;
    }

    /**
    @dev allows user to purchase ticket for the event
    @param quantity total amount of ticket the user wishes to purchase maximum amount is 5
    */
    function purchaseTicket(address receiverAddress, uint256 quantity) public payable {
        require(available  >= quantity, "not enough ticket quantity available!!!");
        require(msg.value >= SafeMath.mul(ticketPrice, quantity), "not enough money sent");
        uint256 newItemId;
        uint256[] memory allItemId;
        string memory stringSender = Strings.toHexString(uint(uint160(msg.sender)));
        address payable minter = payable(receiverAddress);
        newItemId = _tokenIds.current();
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '"event_name": "',
                        evName,
                        '", "description": "',
                        description,
                        '"}'
                    )
                )
            )
        );
        string memory finalTokenUri = string(
            abi.encodePacked("data:application/json;base64,", json)
        );

        _safeMint(minter, newItemId);
        
        // Update the URI!!!
        _setTokenURI(newItemId, finalTokenUri);
        
        uint256 info = uint256(keccak256(
            abi.encodePacked(
                '"receiver address": "',
                stringSender,
                '", "tokenId": "',
                Strings.toString(newItemId),
                '", "tokenURI": "',
                finalTokenUri,
                '"}'
            )
        ));

        uint32 index = merkleTreeAddress.insert(info);
        _tokenIds.increment();
        available--;

        emit TicketPurchased(msg.sender, block.timestamp, index, info, newItemId);
    }

    /**
    
    @dev allow ticket holders to transfer ownership of there ticket to other users
    @param _to address of the reciever 
    @param _tokenId id of the ticket to be transfered
    */
    function transferTicket(address _to, uint _tokenId) public {
        require(address(0) != _to, "invalid address provided");
        transferFrom(msg.sender, _to, _tokenId);
        emit TicketTransfered(msg.sender, _to, _tokenId);
    }


    /**
    @dev validated if a given ticket id is owned by the given user 
    @param _owner address of the owner of ticket to be validated
    @param _tokenIds id of the ticket to be validated
    @return x boolean value holding the result 
    */
    function isTicketValid(address _owner, uint _tokenIds) onlyOwner public returns(bool) {
        if(ownerOf(_tokenIds) == _owner) {
            _burn(_tokenIds);
            return true;
        }  else {
            return false;
        }
    }


    /**
    
    @dev allows event organizers to cancel events they have created 
    */

    function cancelEvent() onlyOwner public {
        // require(now > startDate, "can not cancel event after it has started");
        canceled = true;
    }
    
    /**
    
    @dev lets event organizer get one collected for tickets sold for the event
     */

    function collectPayment() onlyOwner public {
        // require(now > endDate && !canceled, "can not collect payment before the event is over");
        //owner.transfer(address(this).balance);
        selfdestruct(payable(msg.sender));
        emit PaymentCollected(address(this), msg.sender, address(this).balance );
    }

    /**
    
    @dev returns one for each ticket the user has in case the event is canceled
    @param ticket id of the ticket to get refunds for
     */
    function getRefund(uint  ticket) public {
        require(address(0) != msg.sender, "invalid address provided");
        require(canceled, "refund is only available for cacanceled events");
            _burn(ticket);
        payable(msg.sender).transfer(ticketPrice);
        emit TicketRefunded(address(this), msg.sender, ticket, ticketPrice);
    }

    /**
    
    @dev lets users check if the event is canceled or not
    @return true or false
    */
    
    function isCanceled() public view returns(bool) {
        return canceled;
    }
    
    /**
    @dev returns event identity
    @return deployedEvents array of event address */
    function getIdentity() external view returns(address, string memory, uint, uint, string memory, string memory, uint, uint) {
        return (evOwner, evName, startDate, endDate, description, location, ticketPrice, available);
    }
    
    // /**
    
    // @dev get the merkletree leaves
    // @return array of leaves
    // */
    function getMerkleTreeLeaves() public view returns (uint256[] memory) {
        return merkleTreeAddress.getLeaves();
    }
    
    function getZeroValues() public view returns (uint256) {
        return merkleTreeAddress.getZero();
    }

    function getTotalTicketMinted() external view returns (uint256) {
        return _tokenIds.current();
    }

    function getTotalTicketAvailables() external view returns (uint256) {
        return available;
    }
    
    function verifyProof(
        bytes memory proof, 
        uint[] memory pubSignals
    ) public view returns (bool) {
        return IVerifier(verifierAddr).verifyProof(proof, pubSignals);
    }
    
    function verifyTicketEvent(
        bytes memory proof, 
        uint[] memory pubSignals
    ) public view returns (bool) {
        require(verifyProof(proof, pubSignals), "Verify proof failed");
        return true;
    }

}