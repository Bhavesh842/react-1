import React, {useEffect, useState} from 'react'
import services from "../appwrite/conf";
import PostCard from '../components/PostCard'
import Container from '../components/Container';
import { useSelector } from 'react-redux';

function Home() {
    const [posts, setPosts] = useState([])
    const userData = useSelector((state) => state.auth.userdata);
    console.log(userData)
    const userid = userData ? userData.$id : null;
    console.log(userid)
    
useEffect(() => {
    const fetchPosts = async () => {
        const post = await services.getPostsByUser(userid);
        console.log(post);
        if (post) {
            setPosts(post.documents);
        }
    };
    if (userid) fetchPosts();
}, [userid]);

  
  
    if (posts.length === 0) {
        return (
            <div className="w-full py-8 mt-4 text-center">
                <Container>
                    <div className="flex flex-wrap">
                        <div className="p-2 w-full">
                            <h1 className="text-2xl font-bold hover:text-gray-500">
                                Login to read posts
                            </h1>
                        </div>
                    </div>
                </Container>
            </div>
        )
    }
    return (
        <div className='w-full py-8'>
            <Container>
                <div className='flex flex-wrap'>
                    {posts.map((post) => (
                        console.log(post),
                        <div key={post.$id} className='p-2 w-1/4'>
                            <PostCard {...post} />
                        </div>
                    ))}
                </div>
            </Container>
        </div>
    )
}

export default Home