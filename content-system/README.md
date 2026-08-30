# AI Shorts Content System

Pipeline: **content-strategist** → **scriptwriter** → **content-creator** → you review & publish.

Invoke each agent by name (e.g. ask Claude to "use the content-strategist agent to fill the idea backlog").

## Folder map
- `00_pattern_library.md` — decoded hook/structure/pacing analysis of real winning videos (via Higgsfield `video_analysis_create`), owned by content-strategist, **required reading for scriptwriter before every script**
- `01_ideas_backlog.md` — one-line video premises, owned by content-strategist
- `02_calendar.md` — posting schedule, owned by content-strategist
- `03_scripts/` — one file per video, owned by scriptwriter
- `04_output/` — final rendered .mp4 files, owned by content-creator

## Setup still needed before content-creator can render anything
1. fal.ai account + API key, connected as an MCP server
2. JSON2Video account + API key, connected as an MCP server

See the main conversation for exact signup steps.

## Targets (from research)
- Format: AI-generated cartoon mini-stories, 30-60s, recurring character, no real people
- Cadence: 5-7 posts/week minimum
- Revenue floor: $2K/month → needs ~10-25M monthly views → ~10-25 videos/month averaging ~1M views
