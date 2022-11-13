import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";


describe("Inbox", function() {

    async function deployContract() {
        const [owner, otherAccount] = await ethers.getSigners();
        const firstMessage = "First message.";

        const Inbox = await ethers.getContractFactory("Inbox");  // Inbox - constructor
        const inbox = await Inbox.deploy(firstMessage);  // inbox - instance

        return { inbox, firstMessage, owner, otherAccount };
    }

    it("Should deploy a contract", async function() {
        const { inbox } = await loadFixture(deployContract);
        expect( inbox.address );
    });

    it("Should deploy a contract with the right owner", async function () {
        const { inbox, owner } = await loadFixture(deployContract);

        expect(await inbox.owner()).to.equal(owner.address);
    });

    it("Should deploy a contract with correct message", async function() {
        const { inbox, firstMessage } = await loadFixture(deployContract);
        expect(await inbox.message()).to.equal(firstMessage);
    });

    it("Should update a message", async function() {
        // Given
        const { inbox, otherAccount } = await loadFixture(deployContract);
        const newMessage = "new message";
        
        // When
        await inbox.setMessage(newMessage);
        
        // Then
        expect(await inbox.message()).to.equal(newMessage);
    });

    it("Should fail to update message if not owner", async function() {
        // Given
        const { inbox, otherAccount } = await loadFixture(deployContract);
        const newMessage = "new message";
        
        // When/Then
        await expect(inbox.connect(otherAccount).setMessage(newMessage)).to.be.revertedWith(
            "You aren't the owner"
        );
    });

});