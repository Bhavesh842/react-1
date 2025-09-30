import React, { use } from 'react'
import { Link } from 'react-router-dom'
import Logo from './logo.jsx'
import authService from '../appwrite/auth.js'
import { useDispatch } from 'react-redux'
import { login } from '../store/AuthService.js'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import  {useForm} from 'react-hook-form'
import Input from './Input.jsx'
import Button from './Button.jsx'

function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const{register,handleSubmit}=useForm();

    const Loginhandle = async(data)=>{
        try {
            console.log(data)
            const {email,password} = data;
            const session = await authService.login(email,password);
            console.log(session)
            if(session){
                const user = await authService.getcurrentUser();
                console.log(user)
                if(user){
                    dispatch(login(user));
                    navigate('/');
                }
            }
            
            
        } catch (error) {
            console.log(error);
        }

    }
  return (
    <div
    className='flex items-center justify-center w-full'
    >
        <div className={`mx-auto w-full max-w-lg bg-gray-100 rounded-xl p-10 border border-black/10`}>
        <div className="mb-2 flex justify-center">
                    <span className="inline-block w-full max-w-[100px]">
                        <Logo width="100%" />
                    </span>
        </div>
        <h2 className="text-center text-2xl font-bold leading-tight">Sign in to your account</h2>
        <p className="mt-2 text-center text-base text-black/60">
                    Don&apos;t have any account?&nbsp;
                    <Link
                        to="/signup"
                        className="font-medium text-primary transition-all duration-200 hover:underline"
                    >
                        Sign Up
                    </Link>
        </p>
      
        <form onSubmit={handleSubmit(Loginhandle)} className='mt-8'>
            <div className='space-y-5'>
                <Input
                label="Email: "
                placeholder="Enter your email"
                type="email"
                {...register("email", {
                    required: true,
                    validate: {
                        matchPatern: (value) => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value) ||
                        "Email address must be a valid address",
                    }
                })}
                />
                <Input
                label="Password: "
                type="password"
                placeholder="Enter your password"
                {...register("password", {
                    required: true,
                })}
                />
                <Button
                type="submit"
                className="w-full"
                >Sign in</Button>
            </div>
        </form>
        </div>
    </div>
  )
}

export default Login