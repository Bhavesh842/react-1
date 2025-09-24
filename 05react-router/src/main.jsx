import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Layout from './components/layout/Layout.jsx'
import Home from './components/home/Home.jsx'
import About from './components/About/About.jsx'
import User from './components/paramsexample/User.jsx'
import Github, { GithubLoader } from './components/github/Github.jsx'
import{ BrowserRouter, RouterProvider,createBrowserRouter,createRoutesFromElements,Route,Routes }from 'react-router-dom'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/user/:userid" element={<User />} />
      <Route path="/github" element={<Github />} loader={GithubLoader} />
    </Route>
  )
)
createRoot(document.getElementById('root')).render(
 <RouterProvider router={router}>
    <StrictMode>
      <App />
    </StrictMode>
  </RouterProvider>
)
