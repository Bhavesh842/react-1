import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useDispatch } from 'react-redux'
import authService from './appwrite/auth'
import { login,logout } from './store/AuthService'
import Header from './components/Header'
import Footer from './components/Footer'
import { Outlet } from 'react-router-dom'


function App() {
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch();

  useEffect(() => {
    setLoading(true);
    authService.getcurrentUser().then((user) => {
      if (user) {
        dispatch(login(user));
      }
      else{
        dispatch(logout());
        console.log("No user logged in");
      }
      
    }).catch((err) => {
      console.log(err);
    })
    .finally(()=> setLoading(false));
  }, [])

   return !loading ? (
    <div className='min-h-screen flex flex-wrap content-between bg-gray-400'>
      <div className='w-full block'>
        <Header />
        <main>
        TODO:  <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  ) : null
}

export default App
