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

## Stage 3 — Content-creation tools

| Date | Script slug | Tool (Higgsfield / fal.ai+JSON2Video / Viewmax.io) | Cost actually spent | Character consistency (1-5) | Voice quality (1-5) | Render time | Notes | Output file |
|------|-------------|------------------------------------------------------|----------------------|-------------------------------|------------------------|-------------|-------|-------------|
<!-- content-creator agent: append rows below -->
