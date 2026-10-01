"use client";
import { useState } from "react";
const agents=[
 {id:"robin",name:"Robin",description:"Direct Robin/MCP agent connector.",status:"READY"},
 {id:"claude",name:"Claude Agent",description:"Direct connector slot; credentials stay server-side.",status:"CONNECTOR NEEDED"},
 {id:"codex",name:"Codex",description:"Coding and repository work through the control plane.",status:"READY"},
 {id:"orchestrator",name:"Orchestrator",description:"Routes work across connected agents.",status:"READY"}
];
export default function AgentsPage(){
 const [selected,setSelected]=useState("orchestrator"),[prompt,setPrompt]=useState(""),[messages,setMessages]=useState<string[]>([]);
 const agent=agents.find(a=>a.id===selected)!;
 const send=()=>{const v=prompt.trim();if(!v)return;setMessages(m=>[...m,"You -> "+agent.name+": "+v]);setPrompt("")};
 return <main style={{minHeight:"100svh",background:"#070707",color:"#f7f7f7",fontFamily:"system-ui",padding:18,paddingBottom:80}}>
  <header style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><small style={{opacity:.5}}>ELEVAT AI</small><h1 style={{margin:"4px 0",fontSize:30}}>Agent Command</h1></div><small>GLOBAL LOOP ON</small></header>
  <section style={{display:"grid",gap:10,marginTop:18}}>{agents.map(a=><button key={a.id} onClick={()=>setSelected(a.id)} style={{textAlign:"left",padding:15,borderRadius:16,border:a.id===selected?"1px solid #8cffb0":"1px solid #292929",background:a.id===selected?"#102016":"#111",color:"#fff"}}><b>{a.name}</b><div style={{opacity:.6,fontSize:13,marginTop:6}}>{a.description}</div><small style={{opacity:.5}}>{a.status}</small></button>)}</section>
  <section style={{marginTop:16,padding:16,border:"1px solid #292929",borderRadius:18,background:"#0e0e0e"}}><small style={{opacity:.5}}>ACTIVE AGENT</small><h2 style={{margin:"5px 0 12px"}}>{agent.name}</h2><div style={{minHeight:180,padding:12,borderRadius:12,background:"#070707"}}>{messages.length?messages.map((m,i)=><div key={i} style={{marginBottom:10}}>{m}</div>):<div style={{opacity:.4}}>Send a task to the selected agent.</div>}</div><div style={{display:"flex",gap:8,marginTop:10}}><input value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")send()}} placeholder="Tell the agent what to do..." style={{flex:1,padding:13,borderRadius:12,border:"1px solid #333",background:"#151515",color:"#fff"}}/><button onClick={send} style={{padding:"0 17px",border:0,borderRadius:12,fontWeight:700}}>Send</button></div></section>
  <nav style={{position:"fixed",bottom:0,left:0,right:0,padding:12,background:"#090909",borderTop:"1px solid #222",display:"flex",justifyContent:"space-around",fontSize:12}}><span>Agents</span><span>Tasks</span><span>Activity</span><span>Settings</span></nav>
 </main>
}