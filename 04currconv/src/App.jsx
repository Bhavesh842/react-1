import { useState } from 'react'

import InputBox from './components/InputBox'
import usecurrinfo from './hooks/usecurrinfo'

function App() {
  const [count, setCount] = useState(0)
  const [amount1, setAmount1] = useState(1)
  const[from,setfrom] = useState("usd")
  const[to,setto] = useState("inr")
  const[convertedamount,setconvertedamount] = useState(0)
  const currinfo = usecurrinfo(from)
 let BackgroundImage="https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
  let option= Object.keys(currinfo)

  const swap =()=>{
    setfrom(to)
    setto(from)
    setAmount1(convertedamount) 
    setconvertedamount(amount1)
  }

  const convert =()=>{
    setconvertedamount((currinfo[to] * amount1).toFixed(2))
  }


  return (
        <div
            className="w-full h-screen flex flex-wrap justify-center items-center bg-cover bg-no-repeat"
            style={{
                backgroundImage: `url('${BackgroundImage}')`,
            }}
        >
            <div className="w-full">
                <div className="w-full max-w-md mx-auto border border-gray-60 rounded-lg p-5 backdrop-blur-sm bg-white/30">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            convert()
                           
                        }}
                    >
                        <div className="w-full mb-1">
                            <InputBox
                                label="From"
                                amount={amount1}
                                onamountchange={(amount1)=>{setAmount1(amount1)}}
                                currency={from}
                                oncurrencychange={(currency)=>{setAmount1(amount1)}}
                                currencyoptions={option}
                               selectedcurrency={from}
                            />
                        </div>
                        <div className="relative w-full h-0.5">
                            <button
                                type="button"
                                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white rounded-md bg-blue-600 text-white px-2 py-0.5"
                                onClick={swap}
                            >
                                swap
                            </button>
                        </div>
                        <div className="w-full mt-1 mb-4">
                            <InputBox
                                label="To"
                                 amount={convertedamount}
                                //onamountchange={setconvertedamount}
                                currency={to}
                                oncurrencychange={(currency)=>{setto(currency)}}
                                currencyoptions={option}
                               selectedcurrency={to}
                                
                            />
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg">
                            Convert {from} to {to}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default App
