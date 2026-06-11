import { NextResponse,NextRequest } from "next/server";

export async function POST(req:NextRequest){
  try{
    const body=await req.json();
    const event=req.headers.get("x-github-event");

    if(event==="ping"){
      return NextResponse.json({message:"pong"},{status:200})
    }
  return NextResponse.json({message:"Event processed"},{status:200})
  }catch(error){
      console.error("Error processing webhook",error);
      return NextResponse.json({error:"internal server error"},{status:500});
  }
}