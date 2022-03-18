import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"

import {
  bookmarketaddress, bookaddress
} from '../config'

import Market from '../artifacts/contracts/BookMarket.sol/BookMarket.json'
import Book from '../artifacts/contracts/Book.sol/Book.json'

export default function MyAssets() {
  const [books, setBooks] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  useEffect(() => {
    loadBooks()
  }, [])
  async function loadBooks() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
      
    const marketContract = new ethers.Contract(bookmarketaddress, Market.abi, signer)
    const bookContract = new ethers.Contract(bookaddress, Book.abi, provider)
    const data = await marketContract.fetchMyBooks()
    
    const items = await Promise.all(data.map(async i => {
      const bookUri = await bookContract.tokenURI(i.tokenId)
      const meta = await axios.get(bookUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
      }
      return item
    }))
    setBooks(items)
    setLoadingState('loaded') 
  }
  if (loadingState === 'loaded' && !books.length) return (<h1 className="py-10 px-20 text-3xl">No assets owned</h1>)
  return (
    <div className="flex justify-center">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            books.map((book, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={book.image} className="rounded" />
                <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">Price - {book.price} Eth</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}