const { expect } = require("chai");
const { ethers } = require("hardhat");

/* test/sample-test.js */
describe("BookMarket", function() {
  it("Should create and execute market sales", async function() {
    /* deploy the marketplace */
    const Market = await ethers.getContractFactory("BookMarket")
    const market = await Market.deploy()
    await market.deployed()
    const marketAddress = market.address

    /* deploy the Bookcontract */
    const Book = await ethers.getContractFactory("Book")
    const book = await Book.deploy(marketAddress)
    await book.deployed()
    const bookContractAddress = book.address

    let listingPrice = await market.getListingPrice()
    listingPrice = listingPrice.toString()

    const auctionPrice = ethers.utils.parseUnits('1', 'ether')

    /* create two tokens */
    await book.createToken("https://www.mybooks.com/tokens/1")
    await book.createToken("https://www.mybooks.com/tokens/2")
  
    /* put both tokens for sale */
    await market.createMarketItem(bookContractAddress, 1, auctionPrice, { value: listingPrice })
    await market.createMarketItem(bookContractAddress, 2, auctionPrice, { value: listingPrice })
    
    const [_, buyerAddress] = await ethers.getSigners()
  
    /* execute sale of token to another user */
    await market.connect(buyerAddress).createMarketSale(bookContractAddress, 1, { value: auctionPrice})

    /* query for and return the unsold items */
    let items = await market.fetchMarketItems()
    items = await Promise.all(items.map(async i => {
      const tokenUri = await book.tokenURI(i.tokenId)
      let item = {
        price: i.price.toString(),
        tokenId: i.tokenId.toString(),
        seller: i.seller,
        owner: i.owner,
        tokenUri
      }
      return item
    }))
    console.log('items: ', items)
  })
})
