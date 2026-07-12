# Issue tracker: Linear

Issues and PRDs for this repo live in Linear.

## Workflow

Use Linear issues for this repo. Create and find issues in Linear, use the configured triage labels from `docs/agents/triage-labels.md`, and link GitHub branches or PRs back to the relevant Linear issue when applicable.

## Conventions

- **Create an issue**: create a Linear issue with a clear title, markdown description, and the relevant team/project if known.
- **Read an issue**: fetch the Linear issue, including description, comments, labels, state, assignee, project, and relations when relevant.
- **List issues**: query Linear issues by team/project/state/label as needed for the skill.
- **Comment on an issue**: add a Linear comment with the result, question, or handoff.
- **Apply / remove labels**: use the exact label strings from `docs/agents/triage-labels.md`.
- **Close / won't fix**: move the Linear issue to the appropriate done/canceled state and leave a comment explaining the decision.

## Pull requests as a triage surface

External PRs are not a triage surface for this tracker. GitHub PRs may be linked to Linear issues, but `/triage` should not pull PRs into the incoming request queue.

## When a skill says "publish to the issue tracker"

Create a Linear issue.

## When a skill says "fetch the relevant ticket"

Fetch the referenced Linear issue by identifier or URL.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a Linear issue with child/related Linear issues as tickets.

- **Map**: a Linear issue holding Notes / Decisions-so-far / Fog.
- **Child ticket**: a Linear issue linked to the map, with labels or title/body text indicating ticket type (`research`/`prototype`/`grilling`/`task`).
- **Blocking**: use Linear issue relations for blocking/blocker edges when available; otherwise add a `Blocked by:` line in the issue body.
- **Frontier query**: list open child tickets, drop blocked or assigned ones, first in map order wins.
- **Claim**: assign the ticket to the driving dev before work starts.
- **Resolve**: comment with the answer, move the ticket to done, then append a context pointer to the map's Decisions-so-far.
