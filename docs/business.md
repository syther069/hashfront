# Business case

Draft for D2. Numbers marked (est.) are our estimates, not measurements. Incident figures come from public reports and need their links checked before submission.

## The loss we prevent

| Incident | Loss | Sites |
|---|---|---|
| Name.com hijack, Oct 30-31, 2026 | about $138K | 12 |
| Aerodrome / Velodrome, Nov 2025 | $700K+ | 2 |

A single incident costs a protocol more than years of the paid plan, before counting trust and refunds.

## Who pays

The protocol team that owns the frontend. Users are protected for free: they only open a pinned link and the status page.

| Plan | Price | What it includes |
|---|---|---|
| **Free** (X Layer protocols) | $0 | self-hosted watcher, CLI, status page, onchain alerts, verified copy on DeWEB |
| **Hosted** (est.) | $99 per month | hosted watcher with 24/7 uptime, Telegram alerts, CT and DNSSEC signals |
| **Protected** (est.) | $299 per month | hosted plus a second vantage point, the guardian pause for the protocol's contracts, attacker-address reports |

Running costs are tiny: an alert costs about 0.000005 OKB and a release upload about 0.0002 OKB at today's X Layer gas price. The cost of the hosted plans is the watcher server, not the chain.

## Why they would pay

- One prevented incident returns 2 to 10 years of the Protected plan (est., from the table above).
- It is a check teams can't easily build alone: it needs a second network, certificate logs, registry data and an onchain copy of the release.
- Every protocol that adopts it makes the others' pinned links more trusted.

## Open questions

- Willingness to pay is untested. D3 (team interviews) is meant to answer it; this page will be updated with the replies, or say honestly that none came.
