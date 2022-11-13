// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Inbox {
    string public message;
    address payable public owner;
    
    constructor (string memory initialMessage) {
        message = initialMessage;
        owner = payable(msg.sender);
    }
    
    function setMessage(string memory newMessage) public {
        require(msg.sender == owner, "You aren't the owner");
        
        message = newMessage;
    }
}