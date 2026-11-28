# Customer interviews (Track B)

Goal: confirm or correct who Hashfront is for before we build the watcher. **You** send every message; nothing here is sent automatically.
Stop condition: send 8-10 DMs on day 1 (Nov 25-26) and log every reply by Dec 3. If nobody replies by Dec 3, say so honestly in the README and use the public post-mortems as evidence. Log every reply below, including "no". Never paraphrase a reply into a stronger quote than what was said.

## Who to contact
| Group | Where to find them | Why |
|---|---|---|
| X Layer DeFi teams (DyorSwap, LFGSwap, ZeroLend on X Layer, other small protocols) | Their X/Twitter, Telegram or Discord listed on DefiLlama's X Layer page | Launch base and the people judges know |
| Teams hit by the Oct 31, 2026 Name.com hijacks | The Block article and the teams' own incident posts on X | Best evidence of the pain; they know what they wish they had |
| Frontend/devops people at mid-size DeFi teams | Hackathon Telegram, Build X events | Same problem, more likely to pay |

## First message (DM, keep it short)
> Hi [name], I'm building Hashfront for the X Layer TapeOut hackathon: it watches a DeFi frontend's domain (content hash + DNS) and, if it's hijacked, alerts your community within about a minute and points them to a verified copy of your last approved release on chain.
> I'm not selling anything yet. Could I ask you 5 quick questions (15 min call or async here) about how you deploy your frontend and what you'd do if the domain were hijacked?

## Message for teams hit on Oct 30-31 (Name.com)
Teams named in the incident reports: Flap, Kintsu, Pickle Finance, Origami Finance, FluxBeam, Echelon, StonkFun, StakePoint. Contact them only through their public channels.
> Hi [name], sorry about the Name.com incident. I'm building an open tool so small DeFi teams find out about a domain hijack within about a minute and can send users to a verified copy of their app. Would you share, in 15 minutes or async, how you found out, how long it took, and what would have helped? Happy to keep anything you say off the record.
> One more question: would a browser extension that blocks wallet signatures on your site while it is flagged help your users, or would they never install it?

## Post for the TapeOut hackathon Telegram (N2)

The user posts it; Claude never sends anything. Keep it as is or shorten it.

> Hi all, I built Hashfront for this hackathon: it watches your project's normal domain and alerts on Telegram and on chain (TapeSend) within about a minute if the site stops matching the release your maintainers approved, then points users to a verified DeWEB copy.
>
> Free help to set it up for your project: about 15 min on a call. You pay the TapeOut fees for your own gate (about 0.082 OKB once; run the simulation first, it's free). Guide: https://github.com/syther069/hashfront/blob/main/docs/onboarding-15min.md
>
> If you try it, I'd like to list your project as protected in our README (only with your OK). Reply here or DM me.

## Questions (same order every time)
1. Where is your frontend hosted and is it behind a CDN (Cloudflare, Vercel)? Static build or server-rendered?
2. Who can deploy the frontend, and how (CI, manual)? How many people have registrar access?
3. If your domain were hijacked tonight, how would you find out, and how would you tell users? Which channel do your users actually read?
4. Have you had a frontend or DNS incident, or a near miss? How long until you noticed?
5. Would a verified backup link plus a 1-minute alert be worth paying for? Roughly what would feel fair per month, or what would make it a no?
6. Who would your users trust to warn them before they sign: a status page, a wallet warning, a browser extension, or your Telegram?

## Log
| Date | Team | Channel | Replied? | Host/CDN | Deploy owner | Alert channel | Incident history | Would pay? (their words) | What we changed because of it |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |

Quotes go into the README only with the person's permission, word for word. Pricing in `docs/business.md` stays a hypothesis until a reply supports it.
