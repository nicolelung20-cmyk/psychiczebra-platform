import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Result={provider:string;model:string;message:string;usage:unknown};

async function chat(url:string,headers:Record<string,string>,body:unknown,provider:string,model:string):Promise<Result>{
  const r=await fetch(url,{method:"POST",headers,body:JSON.stringify(body),cache:"no-store"});
  const p=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(p?.error?.message||`${provider} failed (${r.status})`);
  return {provider,model:p?.model||model,message:p?.choices?.[0]?.message?.content||"",usage:p?.usage||null};
}

async function openRouter(key:string,messages:unknown[]){return chat("https://openrouter.ai/api/v1/chat/completions",{Authorization:`Bearer ${key}`,"Content-Type":"application/json","HTTP-Referer":process.env.NEXT_PUBLIC_APP_URL||"https://elevat-pearl.vercel.app","X-Title":"Elevat Hermes Command Center"},{model:"openrouter/free",messages,max_tokens:2000},"openrouter-free","openrouter/free");}

async function groq(key:string,messages:unknown[]){return chat("https://api.groq.com/openai/v1/chat/completions",{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},{model:"openai/gpt-oss-20b",messages,max_tokens:2000},"groq-free","openai/gpt-oss-20b");}

async function gemini(key:string,messages:Array<{role:string;content:unknown}>):Promise<Result>{
 const contents=messages.filter(m=>m.role!=="system").map(m=>({role:m.role==="assistant"?"model":"user",parts:[{text:String(m.content)}]}));
 const system=messages.filter(m=>m.role==="system").map(m=>String(m.content)).join("\n");
 const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...system?{systemInstruction:{parts:[{text:system}]}}:{},contents,generationConfig:{maxOutputTokens:2000}}),cache:"no-store"});
 const p=await r.json().catch(()=>({})); if(!r.ok)throw new Error(p?.error?.message||`Gemini failed (${r.status})`);
 return {provider:"gemini-free",model:"gemini-2.5-flash",message:p?.candidates?.[0]?.content?.parts?.map((x:{text?:string})=>x.text||"").join("")||"",usage:p?.usageMetadata||null};
}

async function local(base:string,messages:unknown[]){return chat(base.replace(/\/$/,"")+"/v1/chat/completions",{"Content-Type":"application/json"},{model:process.env.HERMES_LOCAL_MODEL||"qwen2.5:7b",messages,max_tokens:2000},"local-free",process.env.HERMES_LOCAL_MODEL||"qwen2.5:7b");}

export async function POST(req:Request){
 const auth=req.headers.get("authorization")??""; const expected=process.env.SUPABASE_SERVICE_ROLE_KEY??"";
 if(!expected||auth!==`Bearer ${expected}`)return NextResponse.json({ok:false,error:"Unauthorized worker caller"},{status:401});
 const body=await req.json().catch(()=>({})); const messages=Array.isArray(body?.messages)?body.messages:[];
 if(!messages.length)return NextResponse.json({ok:false,error:"messages required"},{status:400});
 const errors:string[]=[];
 const routes=[
  ["openrouter",process.env.OPENROUTER_API_KEY,()=>openRouter(process.env.OPENROUTER_API_KEY!,messages)],
  ["gemini",process.env.GEMINI_API_KEY,()=>gemini(process.env.GEMINI_API_KEY!,messages)],
  ["groq",process.env.GROQ_API_KEY,()=>groq(process.env.GROQ_API_KEY!,messages)],
  ["local",process.env.HERMES_LOCAL_BASE_URL,()=>local(process.env.HERMES_LOCAL_BASE_URL!,messages)]
 ] as const;
 for(const [name,key,run] of routes){if(!key)continue;try{const result=await run();return NextResponse.json({ok:true,...result,ai_policy:"free_only",route:name});}catch(e){errors.push(`${name}: ${e instanceof Error?e.message:String(e)}`);}}
 return NextResponse.json({ok:false,error:"No free AI route succeeded",detail:errors.join(" | ")||"Configure a free cloud key or HERMES_LOCAL_BASE_URL",ai_policy:"free_only",paid_models_allowed:false},{status:503});
}