# Winning Video Pattern Library

Append-only. Owned by content-strategist (writes), required reading for scriptwriter (reads before every script). Never delete an entry — if a pattern goes stale, note that in a new entry rather than removing the old one, so the history of what worked when is preserved.

Refresh cadence: every 1-2 weeks, alongside the strategist's saturation check.

Each entry comes from an actual `video_analysis_create` scene-by-scene breakdown of a real, currently-winning video — not a guess from the title/thumbnail alone.

---

## Entry template (copy this per video analyzed)

### <Channel name> — "<video title>" (analyzed <date>)
- **Source**: <YouTube URL>
- **Analysis tool used**: <Gemini / Higgsfield / OutlierKit — see PROCESS_MAP.md Stage 1>
- **Views / channel age at time of analysis**: <e.g. 2.1M views, channel 41 days old>
- **Hook (0-2s)**: <exactly what's shown/said in the opening beat>
- **Scene count & pacing**: <e.g. 3 scenes: 0-8s setup, 8-14s escalation, 14-22s payoff>
- **Payoff placement**: <where the punchline/twist actually lands, timestamp>
- **Structural trick**: <e.g. direct address to camera, repeated phrase, false-ending-then-twist, escalating-stakes pattern>
- **Reusable takeaway**: <one line — what should scriptwriter borrow from this, in general terms, not just for this one video>

---

<!-- content-strategist agent: append new entries below this line -->

## ⚠️ Session note (2026-09-11): Higgsfield scene-by-scene analysis unavailable this run
All 6 `video_analysis_create` jobs on real psychology/human-behavior shorts candidates (see list in `05_tool_comparison.md`) stayed stuck at `status:"queued"` and never completed, despite ~25 minutes of polling. No `GEMINI_API_KEY` was configured to fall back to Gemini, and OutlierKit is not yet connected. Per the brief, I will not fabricate a specific video's exact hook wording or timestamps that I have not actually watched frame-by-frame. The three entries below are instead **cross-source WebSearch synthesis** — structural patterns corroborated across multiple independent 2026 sources analyzing this exact niche (psychology/weird-facts Shorts), not a single-video tool teardown. They're usable as a starting reference for the scriptwriter but are lower-confidence than a real per-video breakdown and **must be re-verified/replaced with actual Higgsfield/Gemini/OutlierKit output next cycle** once a tool completes successfully.

### Niche-wide structural synthesis — psychology/human-behavior facts Shorts (analyzed 2026-09-11)
- **Source**: Aggregated from multiple candidate videos found via search (e.g. youtube.com/shorts/Qwz1aTCb878, /mlP4r9qE9QM, /REbxO-lLQPQ, /B5CpbEeE5PI) plus independent 2026 hook/retention research (OpusClip, VirVid, UpTube, vidIQ) — not one single video's verified frame-by-frame breakdown.
- **Analysis tool used**: WebSearch synthesis (Higgsfield attempted on all listed videos, did not complete — see 05_tool_comparison.md). **Flag as provisional.**
- **Views / channel age at time of analysis**: Not independently verifiable this session (YouTube view-count pages were not fetchable — egress blocked, and no youtube-toolkit/Composio tool was available). Candidate videos were surfaced by search relevance, not verified view velocity — treat freshness claim as weak until re-checked with a real analytics tool.
- **Hook (0-2s)**: Documented-effective pattern across sources: a "pattern interrupt" bold/contrarian claim or curiosity-gap question delivered in the first 1-3 seconds — e.g. "Everything you know about X is wrong," or a direct-address claim that implicates the viewer personally ("You've been lied to about..."). Videos that open with static list-title text ("5 psychology facts about X") without a claim/question consistently rank as the weaker, more generic-looking format in this niche.
- **Scene count & pacing**: Reported consensus structure for ~30-60s facts Shorts: 0-3s hook/pattern-interrupt, 3-15s surprising claim stated plainly, 15-40s brief explanation/mechanism (often with a visual metaphor or scenario), 40-55s "what this means for you" application beat, 55-60s soft loop/CTA back to the opening line. That's roughly 3-4 distinct beats, each held only a few seconds — fast cutting, no beat lingers past ~10-15s.
- **Payoff placement**: Lands in the 40-55s application beat (not at the very end) — i.e. the "so here's what to do/notice" reveal comes before the final loop line, not after it. The last line is typically a callback/loop rather than the actual payoff.
- **Structural trick**: Two recurring tricks show up repeatedly across sources: (1) **looping/callback** — closing line deliberately echoes or answers the opening hook's claim/question so the video feels complete on rewatch, which several sources tie directly to the algorithm reading rewatches as a quality signal; (2) **direct address ("you")** — nearly all high-performing hooks in this niche speak directly to the viewer ("you've been...", "this is why you...") rather than describing a third party, personally implicating them to raise stakes.
- **Reusable takeaway**: Scriptwriter should build every Ivy script around (a) a direct-address, contrarian-claim or curiosity-gap hook landing by second 2-3, not a generic list-title; (b) a mechanism/explanation beat that stays under ~15s before moving to payoff; (c) a payoff that lands with room left for one final loop line that calls back to the hook's exact wording, since that's the most consistently-cited retention trick in this niche right now. Treat this as directional until a real tool run confirms it on an actual winning video.

### Follow-up needed (2026-09-11)
Re-run `video_analysis_create` on the same 6 candidate URLs next session (they may just have hit a transient backend issue), and/or get `GEMINI_API_KEY` configured so Gemini can serve as the fallback path when Higgsfield queues stall. Until then, treat the entry above as a placeholder, not a substitute for real scene-by-scene analysis.
