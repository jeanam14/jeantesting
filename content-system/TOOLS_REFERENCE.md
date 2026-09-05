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
| fal.ai | Aggregator: 600+ models for video/image/voice (Wan, Kling, Hailuo, etc.) | ~$0.05-0.34/sec depending on model | Needs signup + MCP connection |
| Replicate | Alternative aggregator, larger community model library | Similar to fal.ai, sometimes higher | Backup option, not set up |
| Runware | Cheapest raw unit pricing (images from $0.0006) | Very low | No confirmed MCP — not pursued |
| Novita AI / WaveSpeedAI | Other inference platforms | Comparable | Mentioned, not pursued |
| Higgsfield `faceless-video` workflow | All-in-one generation (locks style/character, no separate assembly) | Credit-based, ~$0.60-9/clip | ✅ Connected |
| Viewmax.io | All-in-one script→voice→scene→export bundle | $14-49/mo flat | Needs signup + MCP connection |

## Content creation — assembly/rendering
| Tool | Role | Cost | Status |
|---|---|---|---|
| JSON2Video | Assembles clips+voice+captions into one finished video, bundled TTS | $16.95-49/mo | Needs signup + MCP connection |
| Shotstack | Same category, no bundled TTS | $49/mo | Considered, not chosen |
| Creatomate | Same category, charges extra for TTS | $41-54/mo | Considered, not chosen |

## Voice/TTS (standalone options)
| Tool | Cost | Status |
|---|---|---|
| ElevenLabs | $0.05-0.10/1,000 chars | Available via Composio, not connected |
| HeyGen | TTS + avatar video | Available via Composio, not connected |
| Speechmatics | $0.011/1,000 chars (cheapest) | Mentioned, not pursued |
| Azure/OpenAI TTS | $0.03-4/million chars | Mentioned as benchmarks |

## Considered and set aside
- **NoimosAI** — broader marketing-automation platform; redundant with the custom strategist/scriptwriter agents already built here
- **ViralOS.studio** — could not independently verify beyond one blog mention; treat with skepticism until confirmed directly
