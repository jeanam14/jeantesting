# Process Map

Status: **quality-first primary stack chosen (2026-09-17)** — the user explicitly prioritized output quality over saving money ("I don't want AI flop videos"). Every alternate tool researched stays documented below, not deleted, so switching back is a small edit, not a rebuild. `05_tool_comparison.md` still logs real cost/quality per render — if an alternate outperforms the primary pick once tested, update this file's ✅ markers.

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

### ✅ PRIMARY pipeline (quality-first, chosen 2026-09-17)
Four sub-steps, each using the tool that wins on *quality* specifically, not just cost:

| Sub-step | Tool | Why this one | Cost | MCP/API status |
|---|---|---|---|---|
| 1. Character consistency (do once, reuse every video) | **Higgsfield** character-sheet workflow | Best-in-class at locking a character's appearance across generations — the #1 fix for the "AI flop" inconsistent-face problem | Credit-based, one-time per character | ✅ already connected |
| 2. Raw clip/image generation | **kie.ai** — model: **Kling 3.0** default, **Veo 3.1** for hero/hook shots | Same top-tier models as fal.ai (Kling 3.0 tops video-model leaderboards; Veo 3.1 = true 4K + native audio) at 30-70% lower price than official/fal.ai rates for the identical output | Kling 3.0 ~$0.10/sec, Veo 3.1 ~$0.20-0.40/sec | Needs signup+key+MCP — see setup below |
| 3. Voiceover | **ElevenLabs via kie.ai** (same key, no separate account) | Best-regarded TTS quality; robotic voice is as big an "AI flop" tell as bad visuals | ~$0.05-0.10/1,000 chars | Covered by kie.ai key |
| 4. Editing/assembly (captions, transitions, sync, render) | **Remotion** | Free, open-source, code-defined — content-creator writes the timeline directly, giving *more* precise control than any black-box SaaS, not a quality tradeoff | Free (self-rendered) or ~$0.01-0.02/video via Remotion Lambda if local render is a bottleneck | No account needed — Node.js + ffmpeg, runs in this environment |

Est. cost per ~45s video on this pipeline: **~$5-15** (higher than the old budget-model estimate, deliberately — this is the "pay slightly more, no flops" tier the user asked for).

### Alternates kept for comparison/fallback (not deleted — swap back anytime)
| Tool | What it does here | Cost (per ~45s video) | MCP/API status | Notes |
|---|---|---|---|---|
| **fal.ai + JSON2Video** (2-tool pipeline) | fal.ai generates raw clips/images/voice; JSON2Video assembles into final captioned video | ~$1.85–2.40 optimistic / ~$3–7 realistic with re-rolls, + JSON2Video flat $16.95/mo | Both need signup+key | Cheaper than the primary pipeline; fal.ai has a broader long-tail model selection than kie.ai if a specific niche model is ever needed |
| **Higgsfield `faceless-video` workflow** (full all-in-one, not just char-sheet) | Locks style/character AND generates + assembles in one flow | Credit-based, ~$0.60–1.00/clip cheap tier to $3-9/clip premium tier | ✅ already connected | Simplest possible path (one tool, zero setup) if the primary 4-step pipeline proves too much overhead |
| **Viewmax.io** | All-in-one: script→voice→scene→export bundle | $14–19/mo (Basic) to $49/mo (Creator+) | Has MCP, needs signup+key | Cheapest option; reviews flag weaker voice/character-consistency — the reason it's not primary given the quality-first priority |
| **OpenMontage** (+ similar: Automated-Video-Generator, Agnes, Open-Generative-AI) | Full open-source agentic pipeline, runs natively in Claude Code, also uses Remotion under the hood | Free core, pay only for premium providers plugged in | No signup — clone the repo | 59.5k stars, actively maintained; worth a real trial once the primary pipeline is validated, since it could absorb steps 2-4 into one orchestrated flow |

## kie.ai setup (the one new thing needed for the primary pipeline)
1. Sign up at kie.ai, generate an API key from the dashboard.
2. Connect as MCP: `claude mcp add kie --env KIE_API_KEY=your_key -- npx -y @felores/kie-ai-mcp-server` (exact package/command to be confirmed once the key is in hand — community MCP servers for kie.ai exist and are documented at docs.kie.ai).

## Testing plan
1. Take the **same finished script** from `03_scripts/`.
2. Produce it through the primary pipeline first once kie.ai is connected; produce it through 1-2 alternates too when there's time, to keep the comparison log honest rather than assuming the primary pipeline is automatically best.
3. Save each output as `04_output/<slug>__<tool>.mp4` (e.g. `04_output/tiny-trouble-01__primary.mp4`, `...__higgsfield-allinone.mp4`, `...__falai-json2video.mp4`).
4. Log cost actually spent, character-consistency (1-5), voice quality (1-5), and overall notes for each in `05_tool_comparison.md`.
5. Revisit this file's primary/alternate marking after 2-3 scripts' worth of real data.
