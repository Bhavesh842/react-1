import React from 'react'
import UserContext from '../context/UserContext'

function Login() {
    const {setUser}=React.useContext(UserContext);
const [username,setUsername]=React.useState("");
const [password,setPassword]=React.useState("");

    const handlesubmit=(e)=>{
        e.preventDefault();
        setUser(username);
    }

    
  return (
    <div>
        <h2>Login</h2>
        <input type="text" value={username} onChange={(e)=>{setUsername(e.target.value)}} placeholder='username' />
        <input type="password" value={password} onChange={(e)=>{setPassword(e.target.value)}} placeholder='password' />
        <button onClick={handlesubmit}>Login</button>
    </div>
  )
}

export default Login