//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./MerkleTree.sol";

/** @title Event */
contract Event is ERC721URIStorage, Ownable {

    string public evName;
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
   
    event TicketPurchased(address purchaser, uint256 quantity, uint date, uint256[] allItemId);
    event TicketTransfered(address _from, address _to, uint256 _tokenId);
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
    uint256 _ticketPrice
    ) ERC721(_name, "ZKEV") public {

        evName = _name;
        startDate = _start;
        endDate = _end;
        ticketPrice = _ticketPrice;
        available = supply;
        description = _description;
        address owner = _organizer;
        location = _location;
        
        merkleTreeAddress = new MerkleTree(supply);
    }

    /**
    @dev allows user to purchase ticket for the event
    @param quantity total amount of ticket the user wishes to purchase maximum amount is 5
    */
    function purchaseTicket(uint256 quantity) public payable {
        require(available  >= quantity, "not enough ticket quantity available!!!");
        require(msg.value >= SafeMath.mul(ticketPrice, quantity), "not enough money sent");
        uint256 newItemId;
        uint256[] memory allItemId;
        string memory stringSender = Strings.toHexString(uint(uint160(msg.sender)));
        
        for(uint8 i = 0; i < quantity; i++) {
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

            // Just like before, prepend data:application/json;base64, to the data.
            string memory finalTokenUri = string(
                abi.encodePacked("data:application/json;base64,", json)
            );

            _safeMint(msg.sender, newItemId);
            allItemId[i] = newItemId;

            // Update the URI!!!
            _setTokenURI(newItemId, finalTokenUri);

            string memory info = Base64.encode(
                bytes(
                    string(
                        abi.encodePacked(
                            '"receiver address": "',
                            stringSender,
                            '", "tokenId": "',
                            Strings.toString(newItemId),
                            '", "tokenURI": "',
                            finalTokenUri,
                            '"}'
                        )
                    )
                )
            );

            merkleTreeAddress.addData(info);

            // Increment the counter for when the next NFT is minted.
            _tokenIds.increment();
            available--;
            // console.logBytes(
            //     "An NFT of event %s with ID %s has been minted to %s",
            //     name,
            //     Strings.toString(newItemId),
            //     stringSender
            // );

        }

        emit TicketPurchased(msg.sender, quantity, block.timestamp, allItemId);
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
    @param _tokenId id of the ticket to be validated
    @return x boolean value holding the result 
    */
    function isTicketValid(address _owner, uint _tokenId) onlyOwner public returns(bool) {
        if(ownerOf(_tokenId) == _owner) {
            _burn(_tokenId);
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
    
    @dev returns one for each ticket the user has incase the event is canceled
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
    
    @dev get the merkletree leaves
    @return array of leaves
    */
    function getMerkleTreeLeaves() public view returns (bytes32[] memory) {
        return merkleTreeAddress.getLeaves();
    }

    function getTotalTicketMinted() public view returns (uint256) {
        return _tokenIds.current();
    }

    function getTotalTicketAvailables() public view returns (uint256) {
        return available;
    }

}