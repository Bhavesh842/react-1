import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'


function App() {
  const [count, setCount] = useState(0)
  const [color, setColor] = useState("")

  const colorClasses = {
    red: "bg-red-500",
    blue: "bg-blue-500",
    // add more colors if needed
  }

  return (
    <>
      <div className={`p-4 rounded-lg ${colorClasses[color] || ""}`}>
        <button onClick={() => setColor("red")}>Red</button>
        <button onClick={() => setColor("blue")}>Blue</button>
      </div>
    </>
  )
}

export default App