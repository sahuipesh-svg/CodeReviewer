import React from "react";
 import LoginUI from "@/module/auth/components/login-ui";
import {requireUnAuth} from "@/module/auth/utils/auth-utils";




const LoginPage = async ()=>{
   requireUnAuth()
   return (
    <div>
     <LoginUI/>
    </div>
   )
}

export default LoginPage;
