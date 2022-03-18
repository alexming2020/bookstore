const hre = require("hardhat");
const fs = require('fs');

async function main() {
  const BookMarket = await hre.ethers.getContractFactory("BookMarket");
  const bookMarket = await BookMarket.deploy();
  await bookMarket.deployed();
  console.log("bookMarket deployed to:", bookMarket.address);

  const Book = await hre.ethers.getContractFactory("Book");
  const book = await Book.deploy(bookMarket.address);
  await book.deployed();
  console.log("book deployed to:", book.address);

  let config = `
  export const bookmarketaddress = "${bookMarket.address}"
  export const bookaddress = "${book.address}"
  `

  let data = JSON.stringify(config)
  fs.writeFileSync('config.js', JSON.parse(data))

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });