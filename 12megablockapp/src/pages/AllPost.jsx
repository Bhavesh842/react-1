import React, { use } from 'react'
import { useState, useEffect } from 'react'
import PostCard from '../components/PostCard'
import Container from '../components/Container'
import services from '../appwrite/conf'

function AllPost() {

    const [posts, setPosts] = useState([])

    useEffect(() => {
        services.getAllPosts([]).then((res) => {
            setPosts(res.documents)
        }).catch((err) => {
            console.log(err)
        })
    }, [])
  return (
     <div className='w-full py-8'>
        <Container>
            <div className='flex flex-wrap'>
                {posts.map((post) => (
                    <div key={post.$id} className='p-2 w-1/4'>
                        <PostCard {...post} />
                    </div>
                ))}
            </div>
            </Container>
    </div>
  )
}

export default AllPost