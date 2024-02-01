const { ethers, deployments } = require("hardhat");
async function main() {
    // const accounts = await ethers.getSigners();
    // deployer = accounts[0].address;
    const fundMeDeployment = await deployments.get("FundMe");
    fundMe = await ethers.getContractAt(
        fundMeDeployment.abi,
        fundMeDeployment.address
    );

    console.log("funding contract...");
    const transactionResponse = await fundMe.fund({
        value: ethers.parseEther("0.5"),
    });
    await transactionResponse.wait(1);
    console.log("Funded");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
