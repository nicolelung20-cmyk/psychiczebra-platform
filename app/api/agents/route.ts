import { NextResponse } from "next/server";
export async function GET(){
 const robin=process.env.ROBIN_BASE_URL??"https://robin-production-f8af.up.railway.app";
 let robinStatus="unreachable";
 try{const r=await fetch(robin+"/_stcore/health",{cache:"no-store",signal:AbortSignal.timeout(4000)});robinStatus=r.ok?"online":"unhealthy"}catch{}
 return NextResponse.json({agents:[
  {id:"orchestrator",name:"Orchestrator",kind:"model",status:"online"},
  {id:"claude",name:"Claude",kind:"model-via-openrouter",status:process.env.OPENROUTER_API_KEY?"online":"needs-provider"},
  {id:"robin",name:"Robin",kind:"railway-service",status:robinStatus,url:robin},
  {id:"codex",name:"Codex",kind:"control-plane",status:"connected-to-github"},
  {id:"researcher",name:"Researcher",kind:"model",status:process.env.OPENROUTER_API_KEY?"online":"needs-provider"},
  {id:"reviewer",name:"Reviewer",kind:"model",status:process.env.OPENROUTER_API_KEY?"online":"needs-provider"}
 ]})
}