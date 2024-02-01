const { getNamedAccounts, ethers, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const {
    isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace");
const { assert } = require("chai");

// let variable = true
/// let someVar = variable ? "yes" : "no"
//  if (variable){someVar = "yes"} else {someVar = "no"}
developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe;
          let deployer;
          const sendValue = ethers.parseEther("1");
          beforeEach(async function () {
              const accounts = await ethers.getSigners();
              deployer = accounts[0].address;

              // assuming we are on a test net, already deployed
              const fundMeDeployment = await deployments.get("FundMe");
              fundMe = await ethers.getContractAt(
                  fundMeDeployment.abi,
                  fundMeDeployment.address
              );
              //       fundMe = await ethers.getContractAt("FundMe", deployer);
          });
          it("Allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue });
              await fundMe.withdraw();
              const endingBalance = await ethers.provider.getBalance(
                  fundMe.getAddress()
              );
              assert.equal(endingBalance, "0");
          });
      });
