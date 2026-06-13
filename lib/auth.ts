import { betterAuth } from "better-auth";
import {prismaAdapter} from "better-auth/adapters/prisma";
import prisma from "./db";
import {PolarClient} from "@/module/payment/config/polar";
import {polar,checkout,portal,usage,webhooks} from "@polar-sh/better-auth"
import { updatePolarCustomerId, updateUserTier } from "@/module/payment/lib/subscription";


export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    socialProviders:{
        github:{
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            scope:["repo"]
        }
    },
    plugins:[
 polar({
      client:PolarClient,
      createCustomerOnSignup:true,
      use: [ 
                checkout({ 
                    products: [ 
                        { 
                            productId: "6695aa9e-2225-4f9d-b9d6-fce4c4f195a6", // ID of Product from Polar Dashboard
                            slug: "pro" // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
                        } 
                    ], 
                    successUrl: "/success?checkout_id={CHECKOUT_ID}", 
                    authenticatedUsersOnly: true
                }), 
                portal({
                     returnUrl:process.env.NEXT_PUBLIC_APP_BASE_URL||'http://localhost:3000/dashboard',

                }), 
                usage(

                ), 
                webhooks({
                    secret: process.env.POLAR_WEBHOOK_SECRET!,
                     onSubscriptionActive:async(payload)=>{
                        const customerId=payload.data.customerId;

                        const user=await prisma.user.findUnique({
                            where:{
                                polarCustomerId:customerId
                            }
                        })
                        if(user){
                            await updateUserTier(user.id,"PRO","ACTIVE",payload.data.id)
                        }



                     },
                     onSubscriptionCanceled:async(payload)=>{
                         const customerId=payload.data.customerId;

                        const user=await prisma.user.findUnique({
                            where:{
                                polarCustomerId:customerId
                            }
                        })
                        if(user){
                            await updateUserTier(user.id,user.subscriptionTier as any,"CANCELED")
                        }
                     },
                     onSubscriptionRevoked:async(payload)=>{
                        const customerId=payload.data.customerId;
                        const user=await prisma.user.findUnique({
                            where:{
                                polarCustomerId:customerId
                            }
                        })
                        if(user){
                            await updateUserTier(user.id,"FREE","EXPIRED")
                        }
                     },
                     onCustomerCreated:async(payload)=>{
                            const user=await prisma.user.findUnique({
                                 where:{
                                    email:payload.data.email!
                                 }
                            })
                            if(user){
                                await updatePolarCustomerId(user.id,payload.data.id)
                            }
                     },
                     onOrderPaid:async()=>{},
                })
            ],
        })
    ]
});



