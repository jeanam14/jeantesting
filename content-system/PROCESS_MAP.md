# Process Map — Tool Testing Phase

Status: **comparing tools before committing to one stack.** Every stage below lists every tool worth testing, not a final choice. Once real videos are produced through each option, `05_tool_comparison.md` records cost/quality/decision, and this file gets updated to mark a winner per stage.

```
┌──────────────────────┐   ┌──────────────────┐   ┌────────────────────────────┐   ┌──────────┐
│ 1. STRATEGY/ANALYSIS  │──>│ 2. SCRIPT         │──>│ 3. CONTENT CREATION         │──>│ 4. YOU   │
│ ideas + decode        │   │ hook, storyline,  │   │ visuals + voice + assembly  │   │ review + │
│ winning videos        │   │ scene breakdown   │   │ → finished .mp4             │   │ publish  │
└──────────────────────┘   └──────────────────┘   └────────────────────────────┘   └──────────┘
   owned by                    owned by                owned by
content-strategist            scriptwriter            content-creator
```

## Stage 1 — Strategy / winning-video analysis
Goal: decode hook, structure, pacing of currently-winning videos in the niche → `00_pattern_library.md`.

| Tool | What it does here | Cost | MCP/API status | Notes |
|---|---|---|---|---|
| **Gemini API** | General video-understanding call (scene description) via direct API/curl, no MCP needed | ~$0.01/video analyzed | Needs `GEMINI_API_KEY` env var | Cheapest by far; output is a raw description you interpret yourself |
| **Higgsfield `video_analysis_create`** | Scene-by-scene breakdown from a YouTube URL | Unclear exact credit cost — bundled in Higgsfield's general credit system | ✅ already connected this session | Already wired into content-strategist; good baseline to compare against |
| **OutlierKit** | Purpose-built: scores hook strength, curiosity loops, pacing, emotional triggers, payoff directly | ~$49/mo (Pro tier, unlocks API+MCP) | Has official MCP + REST API — needs signup+key | Likely richest analysis, but a real subscription cost — best tested once there's revenue, but worth trialing now for quality comparison |

Every entry in `00_pattern_library.md` must now be tagged with **which tool produced it** (see updated template) so quality can be compared side by side later.

## Stage 2 — Script
No tool comparison needed here — pure LLM writing (Claude, this session). Scripts reference whichever pattern-library entries are relevant regardless of which analysis tool produced them.

## Stage 3 — Content creation (visuals + voice + assembly → finished video)

| Tool | What it does here | Cost (per ~45s video) | MCP/API status | Notes |
|---|---|---|---|---|
| **fal.ai + JSON2Video** (2-tool pipeline) | fal.ai generates raw clips/images/voice; JSON2Video assembles into final captioned video | ~$1.85–2.40 optimistic / ~$3–7 realistic with re-rolls, + JSON2Video flat $16.95/mo | Both need signup+key (steps already given) | Most control (pick any model per scene, lock character via reference image), most setup effort |
| **Higgsfield `faceless-video` workflow** | All-in-one: locks style/character, generates + assembles in one flow | Credit-based, ~$0.60–1.00/clip cheap tier to $3-9/clip premium tier per published pricing | ✅ already connected this session | Fastest to test right now, zero new signup |
| **Viewmax.io** | All-in-one: script→voice→scene→export bundle | $14–19/mo (Basic, ~100 exports/mo) to $49/mo (Creator+, 800 credits) | Has MCP, needs signup+key | Cheapest by far if quality holds up; reviews flag weaker voice quality/character-consistency — this is exactly what the comparison test will confirm or refute |

## Testing plan
1. Take the **same finished script** from `03_scripts/`.
2. Produce it through each available tool (start with whichever are already connected — Higgsfield first, since no new signup needed — then fal.ai+JSON2Video and Viewmax.io once their keys are added).
3. Save each output as `04_output/<slug>__<tool>.mp4` (e.g. `04_output/tiny-trouble-01__higgsfield.mp4`, `...__falai-json2video.mp4`, `...__viewmax.mp4`).
4. Log cost actually spent, character-consistency (1-5), voice quality (1-5), and overall notes for each in `05_tool_comparison.md`.
5. Once 2-3 scripts have gone through all tools, pick a winner per stage and update this file's status line.
