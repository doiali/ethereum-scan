"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from 'react'
import ky from 'ky'

const apiClient = ky.create({ prefixUrl: 'http://localhost:8000/api/', retry: 0 })

type Balance = {
  decimals: number
  value: string
}

type Balances = {
  ETH: Balance
  USDC: Balance
  LINK: Balance
}

type RepsoneData = {
  address: string
  balances: Balances
}

export default function Home() {
  const [data, setData] = useState<RepsoneData>()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(event.currentTarget)
    const address = formData.get("address")
    apiClient.get<RepsoneData>(`balance/${address}`).json()
      .then((data) => {
        setData(data)
      }).catch(async (error) => {
        console.log(error)
        const errorMessage = await error.response?.json().then((res: { message: string }) => res.message)
        setError(errorMessage || "Failed to fetch balances")
      }).finally(() => {
        setLoading(false)
      })
  }


  return (
    <div className="pt-24 min-h-screen w-full max-w-lg mx-auto p-2">
      <div className="flex flex-col w-full">
        <h1 className="text-4xl font-bold">Welcome to this app!</h1>
        <p>You can look up an ethereum address!</p>
        <form onSubmit={handleSubmit} className="flex flex-col mt-8">
          <Input required type="text" name="address" placeholder="Etherium address" />
          <Button disabled={loading} className="mt-4" name="address" type="submit">Search</Button>
          {error && <div className="text-destructive mt-2">{error}</div>}
        </form>
        {data && (
          <div className="flex flex-col mt-8 p-4 border rounded-md shadow-md truncate">
            {(["ETH", "USDC", "LINK"] as const).map((token) => (
              <div key={token} className="flex items-center justify-between">
                <span className="font-bold">{token}:</span>
                <span>{formatBalance(data.balances[token])}</span>
              </div>
            ))}
          </div>)
        }
      </div>
    </div>
  )
}

const formatBalance = (balance: Balance) => {
  const value = Number(balance.value) / 10 ** balance.decimals // The value with lost precision
  if (value === 0) return "0"
  if (value >= 1) return value.toLocaleString(undefined, { maximumFractionDigits: 4 })
  else return value.toPrecision(4)
}