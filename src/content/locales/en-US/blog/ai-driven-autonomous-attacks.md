```json
{
  "title": "Thoughts on AI-Driven Autonomous Attacks",
  "metaTitle": "AI-Driven Autonomous Attacks: A Defender's View",
  "metaDescription": "AI shrinks the attacker's workflow, and most autonomous defense tools run with access no service account would get. Apply the discipline you enforce.",
  "slug": "ai-driven-autonomous-attacks",
  "openGraphImagePrompt": "Editorial cybersecurity infographic showing an AI-assisted attack workflow alongside a human-reviewed defense loop, charcoal background, restrained blue and teal with a small red accent, clear spacing, no logos, no text, no neon effects.",
  "tags": ["AI Security", "Autonomous Agents", "Threat Detection", "Adversary Emulation", "Cybersecurity"],
  "keyTakeaway": "AI compresses the time between finding a weakness and exploiting it, and most autonomous defense tools run with broad access and no logging. Treat an AI agent like any automated account: give it its own login with only the permissions it needs, log everything it does, and require a person's approval before it changes a live system.",
  "summary": "AI lets attackers move faster, so defenders have less time to respond. Meanwhile the autonomous AI tools meant to help often run with too much access and no oversight. The post makes the case for running any AI agent like a locked-down account: limited permissions, full logging, and human approval before it changes anything live.",
  "author": "David Awosusi",
  "category": "AI Security",
  "publishedAt": "2025-08-24",
  "updatedAt": "2026-10-28",
  "visual": {
    "title": "Trace an AI tool call into security telemetry",
    "caption": "Correlate an agent action with the endpoint, identity, network, or cloud events it produces, then record the analyst’s decision.",
    "steps": [
      { "label": "agent.session_id", "detail": "Groups tool calls within one agent run." },
      { "label": "action.id + tool.name", "detail": "Identifies the exact call and tool." },
      { "label": "target.asset_id + scope", "detail": "Binds the action to an approved asset and permission boundary." },
      { "label": "event.parent_action_id", "detail": "Links endpoint, identity, network, or cloud events back to the call." },
      { "label": "review.decision", "detail": "Records approval, stop, containment, and outcome validation." }
    ]
  },
  "schema": {
    "title": "Correlating agent actions with observed events",
    "caption": "Join tool-call records to endpoint, identity, network, and cloud telemetry while preserving approved scope and review decisions.",
    "joinLabel": "Join on action_id and parent_action_id",
    "standards": [
      {
        "name": "Agent tool-call record",
        "fields": [
          { "name": "session_id", "meaning": "Agent run" },
          { "name": "action_id", "meaning": "Tool-call identifier" },
          { "name": "parent_action_id", "meaning": "Parent call, if chained" },
          { "name": "tool_name", "meaning": "Tool invoked" },
          { "name": "target_asset_id", "meaning": "Target asset" },
          { "name": "approved_scope", "meaning": "Authorized boundary" }
        ]
      },
      {
        "name": "Observed security event",
        "fields": [
          { "name": "event_time", "meaning": "Event timestamp" },
          { "name": "event_source", "meaning": "EDR, identity, network, or cloud" },
          { "name": "process_guid", "meaning": "Endpoint process identity" },
          { "name": "actor_id", "meaning": "User or workload identity" },
          { "name": "destination", "meaning": "Network or cloud target" },
          { "name": "parent_action_id", "meaning": "Correlated agent action" }
        ]
      }
    ],
    "output": {
      "name": "Correlated investigation record",
      "fields": ["session_id", "action_id", "related_events", "approval", "response", "validated_outcome"]
    }
  }
}
```

## What's changing

In mid-2025, [XBOW](https://xbow.com/blog/top-1-how-xbow-did-it/)'s autonomous pentester reached the top of [HackerOne](https://www.hackerone.com/)'s US leaderboard, outscoring human researchers on real targets. It is a clear sign of where this is going.

The concern was never that a model becomes an attacker on its own. It is that someone connects a capable model to tools, chains the steps, and shortens the time between finding a weakness and exploiting it. Recon, triage, and a first exploit attempt used to take a skilled person days. Now they can run in one loop: plan, act, read the result, and plan again. As that loop speeds up, defenders have less time to notice and respond.

## The risk cuts both ways

Faster attackers are only half of it. The other half is how defenders react. Under pressure to keep up, teams add AI features and assume a vendor's label, a new standard, or a "secure by design" badge means the tool is safe. None of that replaces testing it against your own environment.

The question I keep coming back to: what happens when attackers automate more of their work, and the organization answers with AI defenses it has never actually tested? That is the gap worth watching.

## How I'd run an AI agent

An AI agent is software taking actions on its own. The safe way to run one is the same way you run any automated account, and it is the step most "AI in the SOC" tools skip.

Start by splitting what the agent does into two groups:

- **Let it read freely.** Pulling logs, enriching an alert, summarizing an investigation. Nothing changes, so there is little risk in letting it run.
- **Hold anything that changes a live system.** Isolating a host, disabling an account, pushing a block rule. The agent proposes the action with its evidence, and a person approves it before it runs.

Around that split, five basics:

- **Give it its own login.** Its own identity with only the permissions it needs, not a person's credentials or a shared token.
- **Log every action.** Record the session, the exact action, and what it touched. A chat transcript is not a log.
- **Tie each action to its effect.** Connect it to the endpoint, identity, or network events that followed, so you see what happened, not what the model said happened.
- **Keep the human gate before production.** Scope, evidence, and approval before anything changes a live system.
- **Confirm the result.** Check that the fix or containment worked, and record what changed.

Do that, and an agent's run becomes a record you can audit instead of a black box.

## Where I'm focusing

I expect more security work to move from doing the task to supervising and testing the systems that do it. That is where I am spending my time:

- **AI red teaming** — testing model behavior, tool permissions, and failure paths.
- **Model governance** — how AI systems get approved, monitored, and bounded.
- **AI-assisted threat hunting** — using automation to sort evidence, then checking it against the source data.
- **Adversary emulation** — running realistic activity to see whether detection and response hold.

## What automation can't replace

AI will make a lot of this faster, and that is good. But fast is not the same as right. Someone still has to decide what matters, what is authorized, and what is safe in context, and that comes from understanding the systems, the people, and the risk.
