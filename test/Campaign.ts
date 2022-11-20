import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";


describe("Campaign", function() {
    async function deployContract() {
        const [owner, approver, toolsShop] = await ethers.getSigners();

        const Campaign = await ethers.getContractFactory("Campaign");  // Campaign - constructor
        const campaign = await Campaign.deploy(ethers.utils.parseEther("0.01"), owner.address);  // campaign - instance

        return { campaign, owner, approver, toolsShop };
    }

    describe("deployment", function() {
        it("Should deploy a contract", async function() {
            // Given
            const { campaign } = await loadFixture(deployContract);

            // Then
            expect( campaign.address );
        });

        it("Should deploy a contract with the right manager", async function () {
            // Given
            const { campaign, owner } = await loadFixture(deployContract);

            // Then
            expect(await campaign.manager()).to.equal(owner.address);
        });

        it("Should deploy a contract with the correct minimum amount", async function() {
            // GIven
            const { campaign } = await loadFixture(deployContract);

            // Then
            expect(await campaign.minimumContribution()).to.equal(ethers.utils.parseEther("0.01"));
        });
    });

    describe("contribute to campaign", function() {
        it("Should allow people to contribute to the campaign and mark them as approvers", async function() {
            // Given
            const { campaign, approver } = await loadFixture(deployContract);
            await campaign.connect(approver).contribute({value: ethers.utils.parseEther("0.011")});

            // Then
            expect(await campaign.approvers(approver.address)).to.equal(true); 
            expect(await ethers.provider.getBalance(campaign.address)).to.equal(ethers.utils.parseEther("0.011"));
        });

        it("Should not allow contribute with lesse then 0.01 eth", async function() {
            // Given
            const { campaign, approver } = await loadFixture(deployContract);

            // Then
            expect(campaign.connect(approver).contribute({value: ethers.utils.parseEther("0.01")})).to.be.revertedWith(
                "Minimum required contribution not met"
            );
        });
    });

    describe("payment request", function() {
        it("Should create a request if called by the manager", async function() {
            // Given
            const { campaign, approver, toolsShop } = await loadFixture(deployContract);
            await campaign.connect(approver).contribute({value: ethers.utils.parseEther("0.011")});

            // When
            await campaign.createRequest("Buy tools", ethers.utils.parseEther("0.011"),  toolsShop.address);

            // Then
            const request = await campaign.requests(0);
            expect(request.description).to.equal("Buy tools");
            expect(request.amount).to.equal(ethers.utils.parseEther("0.011"));
            expect(request.recipient).to.equal(toolsShop.address);
            expect(request.complete).to.equal(false);
            expect(request.approvalsCount).to.equal(0);
        });

        it("Should not be allowed to be called by non manager", async function() {
            // Given
            const { campaign, approver, toolsShop } = await loadFixture(deployContract);
            
            // When/Then
            expect(campaign.connect(approver).createRequest("Buy tools", ethers.utils.parseEther("0.011"),  toolsShop.address)).to.be.revertedWith(
                "Call restricted to the manager"
            );
        });
    });

    describe("approve request", function() {
        it("Should be allowed to be approved by donator", async function() {
            // Given
            const { campaign, approver, toolsShop } = await loadFixture(deployContract);
            await campaign.connect(approver).contribute({value: ethers.utils.parseEther("0.011")});
            await campaign.createRequest("Buy tools", ethers.utils.parseEther("0.011"),  toolsShop.address);

            // When
            await campaign.connect(approver).approve(0);

            // Then
            const request = await campaign.requests(0);
            expect(request.approvalsCount).to.equal(1);
        });

        it("Should not be allowed to be approved by non donator", async function() {
            // Given
            const { campaign, approver, toolsShop } = await loadFixture(deployContract);
            await campaign.connect(approver).contribute({value: ethers.utils.parseEther("0.011")});
            await campaign.createRequest("Buy tools", ethers.utils.parseEther("0.011"),  toolsShop.address);
            await campaign.connect(approver).approve(0);

            // When / Then
            expect(campaign.connect(approver).approve(0)).to.be.revertedWith(
                "Can only approve once"
            );
        });
    });

    describe("finalize request", function() {
        it("Should be allowed to be finalized by owner", async function() {
            // Given
            const { campaign, approver, toolsShop } = await loadFixture(deployContract);
            await campaign.connect(approver).contribute({value: ethers.utils.parseEther("0.011")});
            await campaign.createRequest("Buy tools", ethers.utils.parseEther("0.011"),  toolsShop.address);
            await campaign.connect(approver).approve(0);
            const initialBalance = await toolsShop.getBalance();
            const campaignAmount = await ethers.provider.getBalance(campaign.address);

            // When
            await campaign.finalizeRequest(0);

            // Then
            const request = await campaign.requests(0);
            expect(await request.approvalsCount).to.equal(1);
            expect(await request.complete).to.be.true;
            expect(await toolsShop.getBalance()).to.equal(initialBalance.add(ethers.utils.parseEther("0.011")));
            expect(await ethers.provider.getBalance(campaign.address)).to.equal(0);
        });

        it("Should not be allowed to be finalized by non owner", async function() {
            // Given
            const { campaign, approver, toolsShop } = await loadFixture(deployContract);
            await campaign.connect(approver).contribute({value: ethers.utils.parseEther("0.011")});
            await campaign.createRequest("Buy tools", ethers.utils.parseEther("0.011"),  toolsShop.address);

            // When / Then
            expect(campaign.finalizeRequest(0)).to.be.revertedWith(
                "Not enough approvals"
            );
        });

        it("Should not be allowed to be finalized more than once", async function() {
            // Given
            const { campaign, approver, toolsShop } = await loadFixture(deployContract);
            await campaign.connect(approver).contribute({value: ethers.utils.parseEther("0.011")});
            await campaign.createRequest("Buy tools", ethers.utils.parseEther("0.011"),  toolsShop.address);
            await campaign.connect(approver).approve(0);

            // When
            const request = await campaign.finalizeRequest(0);

            // Then
            expect(campaign.finalizeRequest(0)).to.be.revertedWith(
                "Request already finalized"
            );
        });
    
    });
});