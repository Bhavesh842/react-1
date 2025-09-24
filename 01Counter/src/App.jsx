import React,{ useState } from 'react'



function App() {
  const [count, setCount] = useState(10)

  const addfun=()=>{
    if(count>=20){
      alert("cant add above 20");

    }else{
    setCount(count+1)
    }
  }
  
  const removefun=()=>{
     if(count<=0){
      alert("cant add above 20");

    }else{
    setCount(count-1)
    }
  }

  return (
    <>
    
      <h1>CONTER VALUE: {count}</h1>
      <button onClick={addfun}>
        add count
      </button>
      <button onClick={removefun}>
        remove count
      </button>
    
    </>
  )
}

export default App
