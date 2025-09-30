import React from 'react'
import services from '../appwrite/conf.js'
import PostForm from '../components/Postform'
import Container from '../components/Container'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'



function EditPost() {
  const [post, setPosts] = useState(null)
    const {slug} = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        if (slug) {
            services.getpost(slug).then((post) => {
                if (post) {
                    console.log('editpostcomponenetPost',post)
                    setPosts(post)
                }
            })
        } else {
            navigate('/')
        }
    }, [slug, navigate])
  return post ? (
    <div className='py-8'>
        <Container>
            <PostForm post={post} />
        </Container>
    </div>
  ) : null
}

export default EditPost