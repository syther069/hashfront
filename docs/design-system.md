# Design system (status page, approve page, badge, Guard)

One dark theme, built for one job: tell a visitor, in the first second, whether the website they are about to use is the one its maintainers approved, and what to do if it is not.

## What the product needs from its UI

| Who | Their question | What the page puts first |
|---|---|---|
| A user | "Is this site safe to use right now?" | The status banner: what was checked and when, or the open alert, with one primary action (open the verified copy; if there is none, check my approvals) |
| A user after a hijack | "Did I sign something? How do I undo it?" | The suspects card, then "Am I affected?" with the attacker's approval ranked first and one Revoke button per row (or "Revoke all risky") |
| A maintainer | "What exactly am I about to approve?" | The approve page: the onchain root, the manifest check, then the approve button with the reasons it is disabled |
| A judge | "Is this real, and is it honest?" | Live values read from chain, labelled limits (it is not a live check; the watcher may be stopped) |

The policy table, the releases table and the badge are for maintainers and judges, so they sit below the user's path.

## Tokens (`apps/web/src/style.css`)

- **Colour, 60 / 30 / 10 from the palette image:** `--base #111114` (canvas), `--surface #2E2E33` (cards and fields), `--accent #9A9AA3` (the primary action and key information). Every other grey is a mix of these three (`--ink`, `--text`, `--raised`, `--line-strong`).
- **Status colours are the one addition:** `--bad #ff6b5e` and `--good #3fbf95` mean "alert" and "ok" and nothing else. Each always appears with an icon and words, never as colour alone. Remove them and the page loses the one cue a security product relies on, so they are kept on purpose. Say so if you want them gone.
- **Type:** Space Grotesk (the supplied files, variable weight, SIL OFL licence next to them), a 1.25 scale: 12.8, 16, 20, 25, 31, 39 px. Body line height 1.5, headings 1.15, running text at most 72 characters wide. Addresses use the system monospace.
- **Space:** an 8 px scale (8, 16, 24, 32, 48, 64); 4 px only inside compact details.
- **Shape:** two radii, 8 px for controls and 16 px for panels; pills are fully round. No shadows: in a dark theme, surface steps and borders carry depth.
- **Icons:** Iconoir outline icons (MIT), stroke 1.5, copied as inline SVG so no dependency was added. They are decorative unless given a label.
- **Loading:** the bouncing dots from loading.dev, always with words saying what is loading; they rest under `prefers-reduced-motion`.
- **Brand:** `docs/brand/` (the mark and the wordmark); the favicon is the mark.

## Status page: how it reads

- The headline comes from one pure, tested function (`statusModel.ts`): green only when the chain data is fresh, the status server's site check is fresh and says ok, both agree on the release, the gate is not migrated and no alert is open. Otherwise it says why it is not green.
- Order: the headline and one action, then three evidence blocks (live release, latest alert, website check), then "What to do now" for visitors, then release management for maintainers, then folds for technical details and metrics.
- Technical terms carry a small "i" with a plain-language meaning (hover, keyboard focus or tap).

## Rules the code follows

- Every control is at least 44 px tall; focus is a visible 2 px ring; a "Skip to content" link comes first.
- Every failure says what failed and offers a next action (Try again); every wait names what it waits for.
- Narrow screens: the approvals and releases tables become one block per row, with labels; nothing scrolls sideways from 320 px up.
- A truth rule from the UX guide: the page says what it knows. The banner says what it checked and when (and why it is not green), and the Guard note says a batch revoke may ask the wallet for an EIP-7702 upgrade.

## How it is checked

- `apps/web/test/design.test.ts` measures the contrast of every text pair, control border and focus ring against its surface (4.5:1 for text, 3:1 for borders and the ring), checks the palette, the spacing scale, the font files and reduced motion.
- `apps/web/test/web.e2e.ts` loads the page at 320, 390, 768 and 1280 px with an open alert, suspects and approvals, and fails on sideways scroll or a control under 44 px tall.
- The Guard overlay and popup use the same palette; their behaviour is covered by the Guard tests.

## Not done

- The Guard overlay uses the system font: a content script cannot load the site's font files without extra permissions.
- Only a dark theme. A light theme would need the whole matrix of surfaces and states checked again.
- The HashSwap demo site is deliberately not restyled: it stands for a protocol's own website, not for Hashfront.
