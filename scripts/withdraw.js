const { ethers, deployments } = require("hardhat");

async function main() {
    const fundMeDeployment = await deployments.get("FundMe");
    fundMe = await ethers.getContractAt(
        fundMeDeployment.abi,
        fundMeDeployment.address
    );
    console.log("Funding...");
    const transactionResponse = await fundMe.withdraw();
    await transactionResponse.wait(1);
    console.log("Got it back!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
