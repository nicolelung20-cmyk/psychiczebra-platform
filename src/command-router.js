export function routeCommand(command) {
  const text = command.trim().toLowerCase();
  if (/\b(trad|trade|trading|memecoin|crypto|jupiter|paper[- ]?trade)\b/.test(text)) {
    return { agent: "Trading Research Agent", approvalRequired: true };
  }
  if (/\b(content|youtube|shorts|post|social|video)\b/.test(text)) {
    return { agent: "Operator", approvalRequired: false };
  }
  if (/\b(revenue|sales|lead|checkout|product|money)\b/.test(text)) {
    return { agent: "Revenue Agent", approvalRequired: false };
  }
  if (/\b(research|analy[sz]e|find|compare)\b/.test(text)) {
    return { agent: "Researcher", approvalRequired: false };
  }
  if (/\b(build|code|deploy|fix|ship|implement)\b/.test(text)) {
    return { agent: "Coder", approvalRequired: false };
  }
  return { agent: "Orchestrator", approvalRequired: false };
}
