# AI Shorts Content System

**Status: tool-testing phase.** See `PROCESS_MAP.md` for the full stage-by-stage list of tools being compared before we commit to one stack.

Pipeline: **content-strategist** → **scriptwriter** → **content-creator** → you review & publish.

Invoke each agent by name (e.g. ask Claude to "use the content-strategist agent to fill the idea backlog").

## Folder map
- `PROCESS_MAP.md` — master reference: every tool being tested at every stage, with cost and setup status
- `00_pattern_library.md` — decoded hook/structure/pacing analysis of real winning videos, tagged by which analysis tool produced it, owned by content-strategist, **required reading for scriptwriter before every script**
- `01_ideas_backlog.md` — one-line video premises, owned by content-strategist
- `02_calendar.md` — posting schedule, owned by content-strategist
- `03_scripts/` — one file per video, owned by scriptwriter
- `04_output/` — final rendered .mp4 files, one per script × tool tested (e.g. `<slug>__higgsfield.mp4`, `<slug>__falai-json2video.mp4`, `<slug>__viewmax.mp4`), owned by content-creator
- `05_tool_comparison.md` — cost/quality log per tool tested at each stage — this is what eventually decides the winning stack

## Setup status for content-creation tools
1. **Higgsfield** — ✅ already connected, no setup needed, test this first
2. **fal.ai** — account + API key needed, connect as MCP server
3. **JSON2Video** — account + API key needed, connect as MCP server (pairs with fal.ai)
4. **Viewmax.io** — account + API key needed, connect as MCP server

See the main conversation for exact signup steps for 2-4.

## Targets (from research)
- Format: AI-generated cartoon mini-stories, 30-60s, recurring character, no real people
- Cadence: 5-7 posts/week minimum
- Revenue floor: $2K/month → needs ~10-25M monthly views → ~10-25 videos/month averaging ~1M views
