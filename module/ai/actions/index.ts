"use server"

import { inngest } from "@/inngest/client";
import prisma from "@/lib/db"
import { getPullRequestDiff } from "@/module/github/lib/github";

export async function reviewPullRequest(owner:string,repo:string,prNumber:number){
  try{
 const repository=await prisma.repository.findFirst({
   where:{
      owner,
     name:repo
   },
   include:{
     user:{
       include:{
          accounts:{
             where:{
              providerId:"github"
             }
          }
       }
     }
   }
 })
if(!repository){
    throw new Error("Repository not found.Please connect the repository")   
}
  const githubAccount=repository.user.accounts[0];
  if(!githubAccount?.accessToken ){
     throw new Error("Github access token not found.Please connect the repository")
  }
  const token=githubAccount.accessToken;
  await getPullRequestDiff(token,owner,repo,prNumber)

  await inngest.send({
       name:"pr.review.requested",
       data:{
          owner,
          repo,
          prNumber,
          userId:repository.user.id
       }
  })
  return {success:true,meassage:"Review Queued"}
}catch(error){
    try{
      const repository=await prisma.repository.findFirst({
         where:{owner,name:repo}
    })
   if(repository){
       await prisma.review.create({
            data:{
               repositoryId:repository.id,
               prNumber,
               prTitle:"failed to fetch PR",
               prUrl:`https://github.com/${owner}/${repo}/pull/${prNumber}`,
               review:`Error: ${error instanceof Error ? error.message : String(error)}`,
               status:"failed"
            }
       })
   }
}catch(dberror){
    console.error("failed to save error to db",dberror)
}
}
}
