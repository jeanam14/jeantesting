# Tools Reference — Everything Considered

Full list of every tool discussed for this channel, across all stages. See `PROCESS_MAP.md` for the shortlist actually being tested; this file keeps the wider research so we don't re-derive it later.

## Research & competitor data
| Tool | Role | Cost | Status |
|---|---|---|---|
| YouTube Data API (via Composio) | Search videos/channels, stats, comments, transcripts | Free (Google's quota) | ✅ Connected |
| vidIQ | Turnkey niche/keyword research, outlier detection | Subscription | Considered early, not pursued — went direct-API instead |

## Winning-video analysis (hook/structure decoding) — see PROCESS_MAP.md Stage 1
| Tool | Role | Cost | Status |
|---|---|---|---|
| Gemini API | General video-understanding, scene description | ~$0.01/video | Needs API key (no MCP needed, direct API call) |
| Higgsfield `video_analysis_create` | Scene-by-scene breakdown from YouTube URL | Bundled in Higgsfield credits | ✅ Connected |
| OutlierKit | Purpose-built hook/curiosity-loop/emotional-trigger scoring | ~$49/mo | Needs signup + MCP connection |

## Content creation — generation — see PROCESS_MAP.md Stage 3
| Tool | Role | Cost | Status |
|---|---|---|---|
| **kie.ai** ⭐ PRIMARY | Model aggregator, prepaid credit wallet — same top-tier models (Kling 3.0, Veo 3.1, Seedance, Runway, Nano Banana Pro) as fal.ai at 30-70% lower price; also covers ElevenLabs TTS under the same key | Kling 3.0 ~$0.10/sec, Veo 3.1 ~$0.20-0.40/sec | Needs signup + API key + MCP (see PROCESS_MAP.md "kie.ai setup") |
| Higgsfield character-sheet workflow | Locks character appearance across generations — the primary fix for AI-flop inconsistent-face problem | Credit-based, one-time per character | ✅ Connected |
| Higgsfield `faceless-video` workflow | All-in-one generation (locks style/character, no separate assembly) — alternate, not primary | Credit-based, ~$0.60-9/clip | ✅ Connected |
| fal.ai | Aggregator: 600+ models for video/image/voice (Wan, Kling, Hailuo, etc.) — alternate to kie.ai, broader long-tail model selection | ~$0.05-0.34/sec depending on model | Needs signup + MCP connection |
| Replicate | Alternative aggregator, larger community model library | Similar to fal.ai, sometimes higher | Backup option, not set up |
| Runware | Cheapest raw unit pricing (images from $0.0006) | Very low | No confirmed MCP — not pursued |
| Novita AI / WaveSpeedAI | Other inference platforms | Comparable | Mentioned, not pursued |
| Viewmax.io | All-in-one script→voice→scene→export bundle | $14-49/mo flat | Needs signup + MCP connection |

## Content creation — assembly/rendering
| Tool | Role | Cost | Status |
|---|---|---|---|
| **Remotion** ⭐ PRIMARY | Free, open-source, React/code-defined video composition — content-creator writes the timeline (captions, transitions, sync) directly instead of depending on a SaaS renderer | Free (self-rendered) or ~$0.01-0.02/video via Remotion Lambda if local render is a bottleneck | No account needed — needs Node.js + ffmpeg in the environment (not yet verified) |
| JSON2Video | Assembles clips+voice+captions into one finished video, bundled TTS — alternate to Remotion | $16.95-49/mo | Needs signup + MCP connection |
| Shotstack | Same category, no bundled TTS | $49/mo | Considered, not chosen |
| Creatomate | Same category, charges extra for TTS | $41-54/mo | Considered, not chosen |

## Voice/TTS (standalone options)
| Tool | Cost | Status |
|---|---|---|
| ElevenLabs (via kie.ai) ⭐ PRIMARY | $0.05-0.10/1,000 chars | Covered by kie.ai key once connected, no separate account |
| ElevenLabs (standalone via Composio) | $0.05-0.10/1,000 chars | Available via Composio, not connected — redundant once kie.ai is set up |
| HeyGen | TTS + avatar video | Available via Composio, not connected |
| Speechmatics | $0.011/1,000 chars (cheapest) | Mentioned, not pursued |
| Azure/OpenAI TTS | $0.03-4/million chars | Mentioned as benchmarks |

## Full agentic pipelines (alternative to building our own agent chain)
| Tool | Role | Cost | Status |
|---|---|---|---|
| **OpenMontage** (github.com/Open-Montage/OpenMontage; fork `calesthio/OpenMontage`) | Agentic video production system running inside Claude Code — 12 pipelines (Avatar Spokesperson, Documentary Montage, etc.), uses Remotion + HyperFrames for composition, supports 20+ video/15+ image/10+ TTS providers plus free/local options (Piper TTS, open archives) | Free core, AGPLv3; pay only for whichever premium provider you plug in | No signup — clone the repo. 59.5k stars/7.5k forks, actively maintained. Worth a real trial once the primary pipeline is validated — could absorb generation+voice+assembly into one orchestrated flow |
| Automated-Video-Generator (itsPremkumar) | Similar concept, MIT license | Free/zero-cost core | Found during OpenMontage research, not trialed |
| Agnes Video Generator | Similar concept | Varies | Found during OpenMontage research, not trialed |
| OpenShorts | Shorts-specific, has its own MCP | Varies | Found during OpenMontage research, not trialed |
| Open-Generative-AI | Broader generative-AI project touching video | Varies | Found during OpenMontage research, not trialed |

## Considered and set aside
- **NoimosAI** — broader marketing-automation platform; redundant with the custom strategist/scriptwriter agents already built here
- **ViralOS.studio** — could not independently verify beyond one blog mention; treat with skepticism until confirmed directly
