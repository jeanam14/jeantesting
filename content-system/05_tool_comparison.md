# Tool Comparison Log

One row per (script × tool) test. Fill in after each render. This is what decides the winner per stage in `PROCESS_MAP.md` — be honest about weak results, not just cost.

## Stage 1 — Analysis tools

| Date | Video analyzed | Tool (Gemini / Higgsfield / OutlierKit) | Cost | Analysis quality (1-5) | Notes |
|------|-----------------|------------------------------------------|------|------------------------|-------|
| 2026-09-11 | youtube.com/shorts/Qwz1aTCb878 ("4 Dark Psychology Facts About Human Behavior You Won't Believe") | Higgsfield | Unknown — never billed/completed | 1 (unusable) | `video_analysis_create` returned `status:"queued"` immediately, then stayed queued with `updated_at` frozen at `created_at` across 5+ poll cycles over ~25 min (spec says 3-5 min typical). Never reached `completed` or `failed`. |
| 2026-09-11 | youtube.com/shorts/mlP4r9qE9QM ("This PSYCHOLOGICAL Fact Will SHOCK You") | Higgsfield | Unknown — never completed | 1 (unusable) | Same stuck-in-queue behavior. |
| 2026-09-11 | youtube.com/shorts/REbxO-lLQPQ ("6 Mind Blowing Psychology Facts") | Higgsfield | Unknown — never completed | 1 (unusable) | Same stuck-in-queue behavior. |
| 2026-09-11 | youtube.com/shorts/B5CpbEeE5PI ("8 Psychology Facts About Best Friends You NEED to Know!") | Higgsfield | Unknown — never completed | 1 (unusable) | Same stuck-in-queue behavior. |
| 2026-09-11 | m.youtube.com/shorts/c3uLOpS9z9I ("Psych — the Story of the Human Mind") | Higgsfield | Unknown — never completed | 1 (unusable) | Same stuck-in-queue behavior. |
| 2026-09-11 | youtube.com/watch?v=Qwz1aTCb878 (retry of row 1 with canonical `/watch?v=` URL instead of `/shorts/`, to rule out URL-format cause) | Higgsfield | Unknown — never completed | 1 (unusable) | Also stuck in queue — rules out `/shorts/` URL format as the cause; looks like a backend/queue-processing issue this session, not a bad-URL issue. |
| 2026-09-11 | — | Gemini API | N/A | N/A | Not attempted this session — no `GEMINI_API_KEY` found in environment. Needs setup before next comparison round. |
| 2026-09-11 | — | OutlierKit | N/A | N/A | Not attempted — not connected/signed up yet, per process map. Confirm with user before assuming still unavailable. |

**Stage 1 finding this session: Higgsfield's video-analysis tool did not produce a single usable result (0/6 completed).** Recommend: (a) retry Higgsfield next session in case this was a transient outage, (b) get `GEMINI_API_KEY` set up as the cheap fallback since it needs no MCP, (c) ask user whether OutlierKit signup should happen now given Higgsfield's reliability gap. Pattern-library entries below for this cycle are therefore WebSearch-synthesized cross-source structural research on the niche rather than true scene-by-scene tool output — flagged accordingly, to be replaced with real tool output next cycle.

### 2026-09-11 (later same day) — Gemini API now live, 5/5 real per-video analyses

`GEMINI_API_KEY` is now present in `.env` and working. Note: the model named in this file's original brief, `gemini-2.5-flash`, returned HTTP 404 ("no longer available to new users") — had to switch to `gemini-3.6-flash`, which worked on the first retry. Candidates were sourced via the Composio `youtube` toolkit (`YOUTUBE_SEARCH_YOU_TUBE` + `YOUTUBE_GET_VIDEO_DETAILS_BATCH` + `YOUTUBE_GET_CHANNEL_STATISTICS`) to verify real view counts and channel age/true-avg-views before selection, not picked by search relevance alone.

| Date | Video analyzed | Tool (Gemini / Higgsfield / OutlierKit) | Cost | Analysis quality (1-5) | Notes |
|------|-----------------|------------------------------------------|------|------------------------|-------|
| 2026-09-11 | youtube.com/watch?v=DGNuGepjUXs ("Increase Aura In Your Class" — Zyroo Talks, 2.42M views, channel 105d old, true avg 532,869 views/video) | Gemini (`gemini-3.6-flash`) | ~4,892 prompt tokens + 480 output tokens (6,603 total; 4,553 tokens billed as video ingestion) ≈ **$0.002–0.004** at Gemini Flash pricing | 5 (excellent) | Gave verbatim Hindi hook quote + translation, accurate timestamped 6-beat breakdown, correctly identified payoff timestamp and the B-roll/voiceover decoupling trick. No hallucinated specifics detected on spot-check against title/description. |
| 2026-09-11 | youtube.com/watch?v=MHTY0F1levk ("3 Psychology Habits That Make You More Valuable" — MINDORA, 2.48M views, channel 225d old, true avg 190,689 views/video) | Gemini (`gemini-3.6-flash`) | 4,439 prompt + 627 output = 6,045 total tokens ≈ **$0.002–0.004** | 5 (excellent) | Caught a structural detail the prompt didn't explicitly ask for (persistent on-screen header overlay throughout, not just an opening hook) — genuinely useful emergent observation. |
| 2026-09-11 | youtube.com/watch?v=JRwbkBMLyGk ("3 Psychology Signs That May Reveal Deception" — ZIVROXY, 1.04M views, channel 214d old, true avg 223,458 views/video) | Gemini (`gemini-3.6-flash`) | 4,530 prompt + 707 output = 5,994 total tokens ≈ **$0.002–0.004** | 5 (excellent) | Produced a clean markdown table breakdown unprompted; caught the "last one is most powerful" mid-video verbal pre-sell as a distinct retention device. |
| 2026-09-11 | youtube.com/watch?v=dVSEofqLLRU ("2 Dark Psychology Tricks To Read People" — PSYVEXS, 21K views on this video vs. channel true avg 106,835/video, channel 73d old) | Gemini (`gemini-3.6-flash`) | 4,802 prompt + 594 output = 6,131 total tokens ≈ **$0.002–0.004** | 4 (very good) | Solid breakdown; this particular video underperformed its own channel's average so the "payoff" read a bit thinner than the other 3, but that's a property of the video, not the analysis — tool output itself was accurate and specific. |
| 2026-09-11 | youtube.com/watch?v=1hGFVlfJonw ("7 Dark Psychology Facts..." — Better Years, 40.7K views, channel 28d old (freshest sampled), true avg 42,940/video) | Gemini (`gemini-3.6-flash`) | 1,253 prompt + 325 output = 2,284 total tokens ≈ **$0.001** (cheapest of the 5 — short 11s static-text video, far less video-token ingestion) | 4 (very good) | Correctly identified this is a no-voiceover, static-text format — didn't force a hook/payoff narrative onto a video that doesn't have one, which is a good sign of accuracy over pattern-matching bias. |

**Stage 1 finding, this round: Gemini API is fast, cheap (all 5 calls together cost well under $0.02 total, each in the ~2K-6K token range), and produced genuinely specific, verbatim, timestamp-accurate breakdowns — a clear, confirmed win over both the earlier stuck Higgsfield queue and the WebSearch-synthesis fallback.** One caveat: the originally-briefed model ID (`gemini-2.5-flash`) is dead for this key/account — must use `gemini-3.6-flash` going forward, update the standing brief. Recommend Gemini remain the default per the existing brief; still worth re-testing Higgsfield once (in case the queue issue was transient) and OutlierKit once connected, purely for side-by-side quality comparison on the same 5 videos, before fully retiring either.

## Stage 3 — Content-creation tools

| Date | Script slug | Tool (Higgsfield / fal.ai+JSON2Video / Viewmax.io) | Cost actually spent | Character consistency (1-5) | Voice quality (1-5) | Render time | Notes | Output file |
|------|-------------|------------------------------------------------------|----------------------|-------------------------------|------------------------|-------------|-------|-------------|
<!-- content-creator agent: append rows below -->
