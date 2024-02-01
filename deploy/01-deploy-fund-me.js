//import
//main fucntion
//calling main function

const { network } = require("hardhat");
const { verify } = require("../utils/verify");

// function deployfunc(hre) {
//     console.log("hi");
// hre.getNAmedAccounts()
// hre.deployments
// }
const {
    networkConfig,
    developmentChains,
    get,
} = require("../helper-hardhat-config");

// module.exports.default = deployfunc;

module.exports = async ({ getNamedAccounts, deployments }) => {
    //const { getNamedAcounts, deployments } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    // if chainId id Z use address A
    //if chainId is X use Address Y

    //const ethUsdPricefeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    let ethUsdPriceFeedAddress;
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
        console.log(ethUsdPriceFeedAddress);
    }
    log(`Using Price Feed Address: ${ethUsdPriceFeedAddress}`);

    // ...
    const args = [ethUsdPriceFeedAddress];
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // input price feed address
        log: true,
        waitBlockConfirmations: network.config.blockConfirmations || 1,
    });

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        //IF the above condition is met, proceed to verify. the verify codes will be foundb in the utils folder
        await verify(fundMe.address, args);
    }

    log("_____________________________");
};

module.exports.tags = ["all", "fundme"];
