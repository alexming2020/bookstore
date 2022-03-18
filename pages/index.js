import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"

import {
  bookaddress, bookmarketaddress
} from '../config'

import Book from '../artifacts/contracts/Book.sol/Book.json'
import Market from '../artifacts/contracts/BookMarket.sol/BookMarket.json'

let rpcEndpoint = null

if (process.env.NEXT_PUBLIC_WORKSPACE_URL) {
  rpcEndpoint = process.env.NEXT_PUBLIC_WORKSPACE_URL
}

export default function Home() {
  const [books, setBooks] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  useEffect(() => {
    loadBooks()
  }, [])
  async function loadBooks() {    
    const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint)
    const bookContract = new ethers.Contract(bookaddress, Book.abi, provider)
    const marketContract = new ethers.Contract(bookmarketaddress, Market.abi, provider)
    const data = await marketContract.fetchMarketItems()
    
    const items = await Promise.all(data.map(async i => {
      const bookUri = await bookContract.tokenURI(i.tokenId)
      const meta = await axios.get(bookUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        itemId: i.itemId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      return item
    }))
    setBooks(items)
    setLoadingState('loaded') 
  }
  async function buyBooks(book) {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(bookmarketaddress, Market.abi, signer)

    const price = ethers.utils.parseUnits(book.price.toString(), 'ether')
    const transaction = await contract.createMarketSale(bookaddress, book.itemId, {
      value: price
    })
    await transaction.wait()
    loadBooks()
  }
  if (loadingState === 'loaded' && !books.length) return (<h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>)
  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            books.map((book, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={book.image} />
                <div className="p-4">
                  <p style={{ height: '64px' }} className="text-2xl font-semibold">{book.name}</p>
                  <div style={{ height: '70px', overflow: 'hidden' }}>
                    <p className="text-gray-400">{book.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-4 font-bold text-white">{book.price} ETH</p>
                  <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyBooks(book)}>Buy</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}