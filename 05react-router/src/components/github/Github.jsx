import React from 'react'
import { useLoaderData } from 'react-router-dom'

function Github() {
  const data = useLoaderData()
  return (
    <>
    <div>Github:{data.followers}</div>
    <img src={data.avatar_url} alt="avatar" />
    </>

  )
}

export default Github

export const GithubLoader =async ()=>{
    const response = await fetch('https://api.github.com/users/hiteshchoudhary');
    return response.json()
}