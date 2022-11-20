// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract CampaignFactory {
    address[] public deployedCampaigns;
    
    function createCampaign(uint minimum) public {
        Campaign newCampaign = new Campaign(minimum, msg.sender);
        deployedCampaigns.push(address(newCampaign));
    }
    
    function getDeployedCampaigns() public view returns (address[] memory) {  // todo: check why it cant be calldata
        return deployedCampaigns;
    }
}


contract Campaign {
    struct Request {
        string description;
        uint amount;
        address recipient;
        bool complete;
        uint approvalsCount;
        mapping(address => bool) approvals;
    }

    Request[] public requests;
    address public manager;
    uint public minimumContribution;
    mapping(address => bool) public approvers;
    uint public approversCount;

    modifier restricted() {
        require(msg.sender == manager, "Call restricted to the manager");
        _;
    }

    constructor (uint minimum, address creator) {
        manager = creator;
        minimumContribution = minimum;
    }

    function contribute() public payable {
        require(msg.value > minimumContribution, "Minimum required contribution not met");

        approvers[msg.sender] = true;
        approversCount ++;
    }

    function createRequest(string calldata description, uint amount, address recipient) public restricted {
        Request storage newRequest = requests.push();
        newRequest.description = description;
        newRequest.amount = amount;
        newRequest.recipient = recipient;
        newRequest.complete = false;
        newRequest.approvalsCount = 0;
    }

    function approve(uint requestIndex) public {
        require(approvers[msg.sender], "Only donators can approve");
        Request storage request = requests[requestIndex];  // it's storage because we want changes
        // to this variable to be reflected in our requests storage variable.
        require(!request.approvals[msg.sender], "Can only approve once");

        request.approvals[msg.sender] = true;
        request.approvalsCount ++;
    }

    function finalizeRequest(uint requestIndex) public restricted {
        Request storage request = requests[requestIndex];
        
        require(request.approvalsCount > (approversCount / 2), "Not enough approvals");
        require(!request.complete, "Request already finalized");

        payable(request.recipient).transfer(request.amount);
        request.complete = true;
    }
}