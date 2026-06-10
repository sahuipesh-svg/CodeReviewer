"use client"
import React from 'react'
import { signIn } from '@/lib/auth-client'
import { useState } from 'react'


const LoginUI=()=>{

const [isLoading,setIsLoading]= useState(false);

const handleGithubLogin=async ()=>{
     setIsLoading(true)
     try{
       await signIn.social({
         provider: "github",
       })
     }catch(error){
          console.error("login error",error)
          setIsLoading(false)
     }
}



    return (
      <div className='min-h-screen bg-linear-to-br from-black via-black to-zinc-900 text-white dark flex'>
        <div className='flex-1 flex flex-col  justify-center px-12 py-16'>
             <div className="max-w-large">

              <div className="mb-16">
                <div className="inline-flex items-center gap-2 text-2xl font-bold">

                  <div className="w-8 h-8 bg-primary rounded-full"/>
                     <span>CodeLens</span>
                  </div>

              </div>
             <h1 className="text-5xl font-bold mb-6 leading-tight text-balance">
              Cut Code Review Time & Bugs in Half.<span className="black"> Instantly.</span>
              </h1>

            <p className="text-lg text-gray-400 leading-relaxed">

              Supercharge your team to ship faster with most advanced AI code reviews.
            </p>

             </div>
            



        </div>
         <div className='flex-1 flex flex-col justify-center px-12 py-16'>
            <div className="w-full max-w-sm">
              <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-4">Welcome Back</h2>
                  <p className="text-gray-400">
                    Login using  the following methods
                    </p>
              </div>
            <button
              onClick={handleGithubLogin}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary text-black rounded-lg font-semibold hover:bg-primary-foreground disabled:opacity-50 diabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3 mb-8"
               
               >
                
               {isLoading ?"signing in...":"Sign in with Github"}
            </button>
            <div className="space-y-4 text-center text-sm text-gray-400">
                <div>
                  New to CodeLens?{""}
                  <a href="#" className="text-primary hover:text-primary-foreground font-semibold">
                    Sign up
                  </a>
                </div>
                <div>
                   <a href="#" className="text-primary  hover:text-primary-foreground font-semibold">
                    Self Hosted Services
                   </a>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-700 flex justify-center gap -4 text-xs text-gray-500">
                <a href="#" className="hover:text-gray-400">
                  Terms of Service
                </a>
                <span>and</span>
                <a href="#" className="hover:text-gray-400">
                  Privacy Policy
                </a>
            </div>

         </div>


      </div>
      </div>
    )
}


export default LoginUI