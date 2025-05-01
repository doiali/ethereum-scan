import express, { Request, Response } from 'express'
import Web3 from 'web3'
import dotenv from 'dotenv'
import { isAddress } from 'web3-validator'
import cors from 'cors'
dotenv.config()

const INFURA_URL = `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`
const web3 = new Web3(new Web3.providers.HttpProvider(INFURA_URL))

const app = express()
app.use(cors({
  origin: 'http://localhost:3000'
})) // Allow requests from the frontend
const PORT = 8000

// Token contracts on Ethereum mainnet
const TOKENS = {
  USDC: {
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    decimals: 6,
  },
  LINK: {
    address: '0x514910771af9ca656af840dff83e8264ecf986ca',
    decimals: 18,
  },
}

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

const handler = async (req: Request, res: Response) => {
  const { address } = req.params
  if (!isAddress(address)) {
    res.status(400).json({ message: 'Invalid Ethereum address!' })
    return
  }

  try {
    // ETH balance
    const ethWei = await web3.eth.getBalance(address)
    const ethBalance = web3.utils.fromWei(ethWei, 'ether')

    // Token balances
    const balances: Record<string, string> = { ETH: ethBalance }

    for (const [symbol, token] of Object.entries(TOKENS)) {
      const contract = new web3.eth.Contract(ERC20_ABI, token.address)
      const rawBalance = await contract.methods.balanceOf(address).call() as bigint
      const divisor = BigInt(10 ** token.decimals)
      const formattedBalance = (rawBalance / divisor).toLocaleString() + '.' + (rawBalance % divisor).toString().padStart(token.decimals, '0').substring(0, 8)
      balances[symbol] = formattedBalance
    }

    res.json({
      address,
      balances,
    })
  } catch (err) {
    console.error('Error fetching balances:', err.message)
    res.status(500).json({ message: 'Failed to get balances!' })
  }
}

app.get('/api/balance/:address', handler)

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
