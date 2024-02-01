// SPDX-License-Identifier: MIT
//PRAGMA
pragma solidity ^0.8.7;

//IMPORTS
import "./PriceConverter.sol";

// Get funds from users
// withdraw Funds
//Set a minimum funding value in USD#

//ERROR CODES
error FundMe__notOwner();

//INTERFACES,LIBRARIES,CONTRACTS

/// @title A contract for crowd funding
/// @author Osaeketechi Clinton
/// @notice  This contract is to demo a funding contract
/// @dev This implements price feeds as our library

contract FundMe {
    //Type Declaration
    using PriceConverter for uint256;

    //State Variables
    uint256 public constant MINIMUM_USD = 1 * 1e18;
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;

    address private immutable i_owner;
    AggregatorV3Interface private s_priceFeed;

    //MODIFIERS
    modifier onlyOwner() {
        //require( msg.sender ==  i_owner, "Sender is not owner");
        if (msg.sender != i_owner) {
            revert FundMe__notOwner();
        }
        _;
    }

    // FUNCTIONS ORDER:
    /// Constructor
    /// recieve
    /// fallback
    /// external
    /// public
    /// internal
    /// private
    /// view/pure

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // receive() external payable {
    //     fund();
    // }

    // fallback() external payable {
    //     fund();
    // }

    function fund() public payable {
        //want to be able to set a minimu amount in USD
        //1. How do we send ETH to this contract

        //msg.Value is used to get the amount of the token being recieved
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Didn't send enough"
        ); //1e18== 1 *(10**18) == 1000000000000000000
        // The above code means that a minimum of 1eth is required to be able to deposit to this Contract
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public onlyOwner {
        /* starting index,ending index, step amount*/
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funders = s_funders[funderIndex];
            s_addressToAmountFunded[funders] = 0;
        }

        // reset the array
        s_funders = new address[](0);

        // actually withdraw funds
        //transfer
        //payable (msg.sender).transfer.(address(this).balance);
        //send
        //bool sendSuccess = payable (msg.sender).send.(address(this).balance);
        //require(sendSuccess, "send failed");
        //call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "call failed");
    }

    // what happens if someone sends this contract ETH without calling the fund function

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funder = s_funders;
        // mappings can't be in memory
        for (
            uint256 funderIndex = 0;
            funderIndex < funder.length;
            funderIndex++
        ) {
            address funders = s_funders[funderIndex];
            s_addressToAmountFunded[funders] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    /// view/pure

    function getOWner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
