const { assert, expect } = require("chai");
const { Transaction } = require("ethers");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          let sendValue = ethers.parseEther("1");
          beforeEach(async function () {
              const accounts = await ethers.getSigners();
              deployer = accounts[0].address;
              //deploy fundMe contract using Hardhat deploy

              // const accounts = await ethers.getSigners()
              // const accountZero = accounts[0]
              //deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);
              // const signer = await ethers.getSigner(deployer);
              // const fundMeAddress = contract["FundMe"].address;
              const fundMeDeployment = await deployments.get("FundMe");
              //fundMe = await ethers.getContractAt("FundMe", deployer);
              fundMe = await ethers.getContractAt(
                  fundMeDeployment.abi,
                  fundMeDeployment.address
              );
              //console.log(`contract address: ${fundMe.target}`);
              // mockV3Aggregator = await ethers.getContractAt(
              //     "MockV3Aggregator",
              //     deployer
              // );
              const mockV3AggregatorDeployment = await deployments.get(
                  "MockV3Aggregator"
              );
              mockV3Aggregator = await ethers.getContractAt(
                  mockV3AggregatorDeployment.abi,
                  mockV3AggregatorDeployment.address
              );

              //console.log("mockV3address:", mockV3Aggregator.target);
          });
          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, mockV3Aggregator.target);
              });
          });
          describe("fund", async function () {
              it("fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send enough"
                  );
              });
              //Use try-catch to catch any unexpected errors
              //     try {
              //         await fundMe.fund({ value: sendValue }); //1 ETH
              //         // If we reach this point, the transaction didn't revert unexpectedly, so the test passes
              //         assert(true);
              //     } catch (error) {
              //         // If there's an unexpected error, fail the test
              //         assert.fail(`Unexpected error: ${error.message}`);
              //     }
              // });

              it("updates the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  );
                  assert.equal(response.toString(), sendValue.toString());
              });
              it("Adds funder to an array of getFunder", async function () {
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.getFunder(0);
                  assert.equal(funder, deployer);
              });
          });
          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue });
              });
              it("withdraw ETH from a single funder", async function () {
                  //Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.getAddress());
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  //GAS
                  const { gasUsed, gasPrice } = transactionReceipt;
                  const gasCost = gasUsed * gasPrice;

                  const endingFundmeBalance = await ethers.provider.getBalance(
                      fundMe.getAddress()
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  //Assert
                  assert.equal(endingFundmeBalance, 0);
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  );
              });

              it(" Cheaper withdraw ETH from a single funder", async function () {
                  //Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.getAddress());
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  //GAS
                  const { gasUsed, gasPrice } = transactionReceipt;
                  const gasCost = gasUsed * gasPrice;

                  const endingFundmeBalance = await ethers.provider.getBalance(
                      fundMe.getAddress()
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  //Assert
                  assert.equal(endingFundmeBalance, 0);
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  );
              });

              it("Allows us to withdraw with multiple getFunder", async function () {
                  // arrange
                  const accounts = await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.getAddress());
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);

                  const { gasUsed, gasPrice } = transactionReceipt;
                  const gasCost = gasUsed * gasPrice;

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.getAddress()
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);

                  // assert
                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(accounts[i]),
                          0
                      );
                  }

                  // assert.equal(endingFundMeBalance, 0);
              });
              it("only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners();
                  const attacker = accounts[1];
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  );
                  expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__notOwner");
              });
              it("cheaper withdraw testing ...", async function () {
                  //Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.getAddress());
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  //GAS
                  const { gasUsed, gasPrice } = transactionReceipt;
                  const gasCost = gasUsed * gasPrice;

                  const endingFundmeBalance = await ethers.provider.getBalance(
                      fundMe.getAddress()
                  );
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer);
                  //Assert
                  assert.equal(endingFundmeBalance, 0);
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + gasCost
                  );
              });
          });
      });
