import { NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabase/server";

type Message={role:"user"|"assistant";content:string};
const MODELS:Record<string,string>={
  orchestrator:process.env.OPENROUTER_MODEL??"anthropic/claude-opus-latest",
  claude:"anthropic/claude-opus-latest",
  researcher:"google/gemini-2.5-flash",
  reviewer:"openai/gpt-5",
  coder:"openai/gpt-5-codex"
};
function token(request:Request){const h=request.headers.get("authorization")??"";return h.startsWith("Bearer ")?h.slice(7):""}
function valid(v:unknown):v is Message[]{return Array.isArray(v)&&v.length>0&&v.length<=12&&v.every(x=>typeof x==="object"&&x!==null&&(x as any).role&&((x as any).role==="user"||(x as any).role==="assistant")&&typeof (x as any).content==="string"&&(x as any).content.length<=12000)}
export async function POST(request:Request){
 const access=token(request); if(!access)return NextResponse.json({error:"Please sign in."},{status:401});
 let body:any; try{body=await request.json()}catch{return NextResponse.json({error:"Invalid JSON."},{status:400})}
 if(!valid(body.messages))return NextResponse.json({error:"Invalid messages."},{status:400});
 const agent=typeof body.agent==="string"?body.agent:"orchestrator";
 const model=MODELS[agent]??MODELS.orchestrator;
 try{
  const supabase=createUserClient(access); const {data:auth,error}=await supabase.auth.getUser(); if(error||!auth.user)return NextResponse.json({error:"Session expired."},{status:401});
  const {data:allowed,error:usageError}=await supabase.rpc("consume_message"); if(usageError)throw usageError; if(!allowed)return NextResponse.json({error:"Monthly message limit reached."},{status:402});
  const key=process.env.OPENROUTER_API_KEY; if(!key)throw new Error("OPENROUTER_API_KEY missing");
  const response=await fetch((process.env.OPENROUTER_BASE_URL??"https://openrouter.ai/api/v1")+"/chat/completions",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json","HTTP-Referer":process.env.NEXT_PUBLIC_APP_URL??"http://localhost:3000","X-Title":"Elevat AI Agent Command"},body:JSON.stringify({model,messages:[{role:"system",content:"You are the "+agent+" agent inside Elevat AI's multi-agent command center. Return concise, actionable work. Do not claim access to tools or systems you have not been given."},...body.messages],max_tokens:1200})});
  if(!response.ok){console.error("agent provider",response.status,await response.text());return NextResponse.json({error:"Agent provider unavailable."},{status:502})}
  const p=await response.json(); const message=p.choices?.[0]?.message?.content?.trim(); if(!message)return NextResponse.json({error:"Agent returned no response."},{status:502});
  return NextResponse.json({message,agent,model});
 }catch(e){console.error("agent chat",e);return NextResponse.json({error:"Agent service is not configured correctly."},{status:500})}
}