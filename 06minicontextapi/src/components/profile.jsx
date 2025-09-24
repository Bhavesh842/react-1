import React from 'react'
import UserContext from '../context/UserContext'

function Profile() {
    const {user}=React.useContext(UserContext)
  return (
    <div>profile:{user}</div>
  )
}

export default Profile