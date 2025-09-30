import React from 'react'
import { useDispatch } from 'react-redux'
import { logout } from '../store/AuthService.js'
import authService from '../appwrite/auth.js'

function LogoutBtn() {
    const dispatch = useDispatch();
    const handleLogout = () => {
        authService.logout().then(()=>{
            dispatch(logout());
        })
    }
  return (
    <button  className='inline-bock px-6 py-2 duration-200 hover:bg-blue-100 rounded-full' onClick={handleLogout}>LogoutBtn</button>
  )
}

export default LogoutBtn