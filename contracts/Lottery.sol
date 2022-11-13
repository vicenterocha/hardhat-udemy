// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Lottery {
    address public manager;
    address[] public players;  // public arrays can only return one element at a time
    
    constructor () {
        manager = payable(msg.sender);
    }

    function enter() public payable {
        require(msg.value > .01 ether, "Minimum requirement of 0.01 Ether not sent");  // .01 ether converts it to WEI

        players.push(msg.sender);
    }

    function pickWinner() public restricted{
        require(players.length > 0, "Can't pick winner of 0 players");
        
        uint winnerIndex = random();
        address winner = players[winnerIndex];
        
        payable(winner).transfer(address(this).balance);

        resetState();
    }

    function random() private view returns (uint){
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, players))) % players.length;
    }

    function resetState() private {
        delete players;
    }

    function getPlayers() public view returns (address[] memory){
        return players;
    }

    modifier restricted() {
        require(msg.sender == manager, "Only the manager can perform this action");
        _;
    }
}