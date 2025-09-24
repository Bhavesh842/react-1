import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Card from './components/card'    

function App() {
 
  let titles = "Welcome to React with Tailwind CSS"
  let disc="This is a simple card component."


  return (
    <>
     <Card
      title={titles}
      description={disc}
       />

    

    </>
  )
}

export default App
