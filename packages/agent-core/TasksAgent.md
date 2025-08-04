Technical roll-out plan for bringing 3 – the “10-person, $100 B company” vision and 4 – the multi-agent infrastructure into Emplin

(Narrative format – no tables)

⸻

1. Objectives and KPIs

• Shrink head-count–to–output ratio: target ≥ $1 M annual revenue for every human FTE plus active agent.
• Agent incidents heal themselves in < 5 min (MTTR).
• Cost ceiling: ≤ $0.30 per 1 000 LLM tokens consumed by any single agent.
• Spin-up time for a new vertical kit: ≤ 3 calendar days from YAML spec → production.

⸻

2. Core architecture – layer by layer

Agent SDK & templates – Use LangGraph’s graph DSL to declare each agent as a small directed graph (Planner → Tool-calls → Critic). It gives deterministic execution and lets you unit-test sub-nodes rather than one giant prompt.  ￼ ￼

Durable execution & human-in-the-loop – Wrap every agent graph in a Temporal Workflow. Temporal keeps full state on disk, restarts on crash, and pauses for human approvals without losing context.  ￼ ￼

Runtime on Kubernetes – Ship agents as CRDs with kagent: kubectl apply -f inventory-restock.yaml turns the template into a Deployment + HPA and wires secrets from External-Secrets/Vault. Autoscaling then belongs to Kubernetes, not application logic.  ￼ ￼

Event mesh – Give every agent a lightweight pub/sub channel (NATS JetStream). Side-car clients handle stream back-pressure and at-least-once delivery, so planner nodes can await messages instead of polling databases.

Shared memory & long-term context – Store hot, per-conversation state in Redis Streams; push cold, semantic memory into Supabase Postgres with pgvector for similarity search across months of logs.  ￼ ￼

Policy & governance – Model fine-grained permissions in OpenFGA. Each agent call first hits an OpenFGA check (does agentX have write access on purchase_orders?). Add a “budget” relation so OpenFGA blocks calls that exceed the monthly token allowance.  ￼ ￼

Observability & evaluation –
• Instrument every LangGraph node with OpenTelemetry; export traces to Grafana Tempo.
• Nightly replay real traffic through crew-eval or LangSmith to catch regressions on updated models.

Agent marketplace – A Next.js+Stripe front-end that loads agent-manifest.json from git, shows screenshots, and one-click deploys by posting the CRD to the cluster. Revenue share handled by Stripe Connect.

⸻

3. Implementation phases

Phase 0 – Spike (weeks 1-4)
	1.	Pick a single flow: “Low stock → auto-restock order”.
	2.	Write the agent manifest: YAML with trigger, LangGraph nodes, OpenFGA policy reference.
	3.	Deploy via kagent; wire to Shopify sandbox; show trace in Grafana.
	4.	Measure tokens, cost, latency; iterate until the ceiling (< $0.30 / 1 K) is met.

Phase 1 – Core infra hardening (weeks 5-12)
• Publish the internal Agent SDK with type hints and unit-test stubs.
• Add Redis Streams + pgvector integration layer.
• Ship an OpenFGA policy authoring CLI so vertical teams can define rules without touching code.

Phase 2 – Vertical kits alpha (Q4 ’25)
• Bakery kit: OrderAgent, InventoryAgent, PayrollAgent, LoyaltySMSEngine.
• Peak 1031 kit: ComplianceAgent, FundsFlowAgent, ClientCommsAgent.
Each kit is no more than a git folder of manifests plus a README; on merge the CI pipeline applies them to the customer’s namespace.

Phase 3 – Observability & guardrails (Q1 ’26)
• Hook OTEL traces to alerts: MTTR > 5 min triggers PagerDuty.
• Add budget interceptor in Temporal—blocks the activity if projected cost > budget.

Phase 4 – Marketplace GA (Q2 ’26)
• Expose catalog UI, Stripe billing, version pinning, and dependency resolution (AgentA@2.1 requires AgentB≥1.4).
• Run security review on every community-submitted agent before listing.

⸻

4. Sprint-level backlog (first 30 days)
	1.	Create monorepo skeleton: /agents, /infra, /vertical-kits.
	2.	Integrate LangGraph into a Temporal activity wrapper; commit sample test.
	3.	Define kagent Helm chart with resource limits.
	4.	Stand up NATS cluster inside existing EKS; write publisher/consumer SDK.
	5.	Provision pgvector on Supabase, add Go client to infra package.
	6.	Author first OpenFGA model: agent, vertical, tokenBudget.
	7.	Demo end-to-end “Bakery inventory” flow to internal stakeholders.

A green light on that demo means you can begin cloning patterns for additional agents and, by extension, progress toward a 10-person, AI-run enterprise.

⸻

5. Risk controls

• Hallucination with costly side-effects → every high-impact activity passes through a Critic node and, if value > $1 k, fires a Temporal AwaitApproval event.
• Vendor lock-in → abstract model calls behind a small LLMProvider interface (OpenAI, Anthropic, Gemini).
• Compliance (EU AI Act) → enforce trace logging and model/usage provenance in the immutable agent_events log.

⸻

6. Immediate next step

Clone the “inventory restock” manifest from the draft branch, update the Shopify sandbox keys in Vault, and run kubectl apply.
Once the first workflow completes without manual intervention, instrument it and capture the metrics; those numbers become the baseline for scaling the rest of the platform.