const lanes = [
  ["Orchestrator", "routes work and owns global state"],
  ["Researcher", "finds evidence and returns compact findings"],
  ["Coder", "implements bounded changes"],
  ["Reviewer", "tests and audits every change"],
  ["Ops", "deploys, monitors, and recovers"],
  ["Security", "checks permissions, secrets, and risk"],
  ["Revenue", "tracks approved growth workflows"],
];

const rules = [
  "Every meaningful event is broadcast globally.",
  "Agents exchange compact task packets, not giant transcripts.",
  "Persistent state survives model/provider changes.",
  "Routing falls back across available executors when capacity is exhausted.",
  "Retries are idempotent so failures do not duplicate side effects.",
  "Production deployments and financial actions remain approval-gated.",
];

export default function CommandCenterPage() {
  return (
    <main style={{minHeight:"100vh",padding:"40px",fontFamily:"system-ui",background:"#090909",color:"#f5f5f5"}}>
      <h1 style={{fontSize:42,marginBottom:8}}>Limitless Command Center</h1>
      <p style={{opacity:.75,maxWidth:760}}>
        Global agent loop + quota-resilient routing + persistent state. “Limitless”
        means the control plane can switch executors and compact context; it does not
        promise infinite model tokens.
      </p>

      <section style={{marginTop:32,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14}}>
        {lanes.map(([name,desc]) => (
          <article key={name} style={{border:"1px solid #292929",borderRadius:14,padding:18,background:"#111"}}>
            <strong>{name}</strong>
            <div style={{marginTop:8,opacity:.7}}>{desc}</div>
            <div style={{marginTop:14,fontSize:12}}>GLOBAL LOOP: ON</div>
          </article>
        ))}
      </section>

      <section style={{marginTop:28,border:"1px solid #292929",borderRadius:14,padding:20,background:"#111"}}>
        <h2 style={{marginTop:0}}>Global operating contract</h2>
        <ul>{rules.map((rule) => <li key={rule} style={{margin:"10px 0"}}>{rule}</li>)}</ul>
      </section>
    </main>
  );
}
