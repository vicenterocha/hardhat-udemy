import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";


describe("Lottery", function() {
    async function deployContract() {
        const [owner, otherAccount] = await ethers.getSigners();

        const Lottery = await ethers.getContractFactory("Lottery");  // Lottery - constructor
        const lottery = await Lottery.deploy();  // lottery - instance

        return { lottery, owner, otherAccount };
    }

    describe("deployment", function() {
        it("Should deploy a contract", async function() {
            // Given
            const { lottery } = await loadFixture(deployContract);

            // Then
            expect( lottery.address );
        });

        it("Should deploy a contract with the right manager", async function () {
            // Given
            const { lottery, owner } = await loadFixture(deployContract);

            // Then
            expect(await lottery.manager()).to.equal(owner.address);
        });

        it("Should deploy a contract with zero players", async function() {
            // GIven
            const { lottery } = await loadFixture(deployContract);

            // Then
            expect(await lottery.getPlayers()).to.have.length(0);
        });
    });

    describe("enter lottery", function() {
        it("Should add player to players when they enter lottery", async function() {
            // Given
            const { lottery, otherAccount } = await loadFixture(deployContract);
            await lottery.connect(otherAccount).enter({value: ethers.utils.parseEther("0.012")});

            // Then
            const players = await lottery.getPlayers();
            await expect(players).to.have.length(1);
            expect(players[0]).to.equal(otherAccount.address);

        });
        it("Should not allow to enter lottery if value not greater than 0.01 ether", async function() {
            // Given
            const { lottery, otherAccount } = await loadFixture(deployContract);

            // Then
            await expect(lottery.connect(otherAccount).enter({value: ethers.utils.parseEther("0.01")})).to.be.revertedWith(
                "Minimum requirement of 0.01 Ether not sent"
            );
        });

        it("Should not be allowed to be called by non manager", async function() {
            // Given
            const { lottery, otherAccount } = await loadFixture(deployContract);
            
            // Then
            await expect(lottery.connect(otherAccount).pickWinner()).to.be.revertedWith(
                "Only the manager can perform this action"
            );
        });

        it("Should add balance to contract", async function() {
            // Given
            const { lottery, otherAccount } = await loadFixture(deployContract);

            // When
            await lottery.connect(otherAccount).enter({value: ethers.utils.parseEther("0.012")});
            await lottery.connect(otherAccount).enter({value: ethers.utils.parseEther("0.013")});

            // Then
            expect(await ethers.provider.getBalance(lottery.address)).to.equal(ethers.utils.parseEther("0.025"));
        });
    });

    describe("winner selection", function() {
        it("Should only be allowed to be called by the manager", async function() {
            // Given
            const { lottery, owner, otherAccount } = await loadFixture(deployContract);
            await lottery.connect(otherAccount).enter({value: ethers.utils.parseEther("0.012")});

            // Then
            await lottery.pickWinner();
        });

        it("Should not be allowed to be called by non manager", async function() {
            // Given
            const { lottery, otherAccount } = await loadFixture(deployContract);
            
            // When/Then
            await expect(lottery.connect(otherAccount).pickWinner()).to.be.revertedWith(
                "Only the manager can perform this action"
            );
        });

        it("Should reset players after winner is picked", async function() {
            // Given
            const { lottery, otherAccount } = await loadFixture(deployContract);
            await lottery.connect(otherAccount).enter({value: ethers.utils.parseEther("0.012")});

            // When
            await lottery.pickWinner();

            // Then
            expect(await lottery.getPlayers).to.have.length(0);
        });
        

        it("Should send balance to winner", async function() {
            // Given
            const { lottery, owner, otherAccount } = await loadFixture(deployContract);
            await lottery.connect(otherAccount).enter({value: ethers.utils.parseEther("0.012")});
            const afterEnterBalance = await otherAccount.getBalance();

            // When
            await lottery.pickWinner();

            // Then
            expect(await otherAccount.getBalance() > afterEnterBalance).to.equal(true);
            expect(await ethers.provider.getBalance(lottery.address)).to.equal(0);
        });
    });

});