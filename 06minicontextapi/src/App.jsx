import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Login from './components/login'
import Profile from './components/profile'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <h1>react :- Context Api</h1>
     <Login/>
     <Profile/>
    </>
  )
}

export default App
