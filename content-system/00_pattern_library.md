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

---

## ⚠️ SUPERSEDING UPDATE (2026-09-11, later same day): Real Gemini tool output now available — replaces the WebSearch-synthesis entry above

`GEMINI_API_KEY` is now configured in `.env` and confirmed working. The niche-wide synthesis entry above should now be treated as **historical/lower-confidence** — the 5 entries below are real, per-video Gemini `generateContent` scene-by-scene breakdowns (model: `gemini-3.6-flash`, note the originally-briefed `gemini-2.5-flash` is deprecated/404s for this key and had to be swapped), on videos independently sourced and verified via the YouTube Data API (Composio `youtube` toolkit — `YOUTUBE_SEARCH_YOU_TUBE`, `YOUTUBE_GET_VIDEO_DETAILS_BATCH`, `YOUTUBE_GET_CHANNEL_STATISTICS`), not search-relevance guesses. Channel "true average views" = total channel viewCount / total channel videoCount, per the standing project method. Selection was biased toward channels under ~90 days old, but two older-but-still-young, exceptionally consistent channels (MINDORA, ZIVROXY) were deliberately included alongside the very fresh ones (Better Years, 28 days old; PSYVEXS, 73 days old) for contrast — see each entry's stats.

### Zyroo Talks — "Increase Aura In Your Class" (analyzed 2026-09-11)
- **Source**: https://www.youtube.com/watch?v=DGNuGepjUXs
- **Analysis tool used**: Gemini (`gemini-3.6-flash`, direct API call via curl)
- **Views / channel age at time of analysis**: 2,420,459 views on this video; channel created 2026-05-29 → **105 days old**; 55 total videos, 29,307,783 total channel views → **true avg ≈ 532,869 views/video** (strongest true-average of every channel checked this session)
- **Hook (0-2s)**: Visual: a man walking while using his phone as a CGI car flips over him; text overlay "DANGEROUS AURA". Spoken (Hindi): "Aaj se puri class mein tumhara aura sabse dangerous hoga..." ("From today, your aura in the whole class will be the most dangerous...")
- **Scene count & pacing**: 6 beats in 50s: 0-3s hook, 3-8s intro/subscribe prompt, 8-21s Point 1, 21-34s Point 2, 34-46s Point 3, 46-50s comment-bait close. Each numbered point runs ~13s.
- **Payoff placement**: 0:38-0:45 — Point 3 (respond to disrespect with a 2-second expressionless silent stare) is delivered as the strongest/final rule, i.e. payoff is back-loaded to the last list item, not a separate beat after the list.
- **Structural trick**: Numbered listicle (3 psychology "rules") voiced over completely unrelated hypnotic/ASMR B-roll (kinetic sand, icing, snow-scraping, mirror-cleaning) that has nothing to do with the spoken content — visual retention is carried entirely by the B-roll, not by illustrating the advice. Closes on a comment-bait question ("which class grade are you in?").
- **Reusable takeaway**: The advice/voiceover track and the visual track can be almost fully decoupled — satisfying/hypnotic B-roll is doing the retention work, freeing the audio to be a dense, fast 3-point listicle. Worth testing on an Ivy script: keep Ivy's voice as the tight numbered-list psychology content, but don't feel obligated to illustrate every line literally.

### MINDORA — "3 Psychology Habits That Make You More Valuable" (analyzed 2026-09-11)
- **Source**: https://www.youtube.com/watch?v=MHTY0F1levk
- **Analysis tool used**: Gemini (`gemini-3.6-flash`)
- **Views / channel age at time of analysis**: 2,483,176 views on this video; channel created 2026-01-29 → **225 days old** (kept in the sample despite exceeding the 90-day bias because of how consistent the channel is); 69 total videos, 13,157,521 total channel views → **true avg ≈ 190,689 views/video**
- **Hook (0-2s)**: Visual: persistent top-of-screen text overlay "IGNORE POWER" over rapid pop-culture character edits (Jacob Elordi, Sydney Sweeney, Light Yagami from Death Note). Spoken (Hindi): "Koi tumhe kitna bhi ignore kyon na kare, lekin agar tum ye 3 cheeze kar lo, toh woh tumse baat karne ke liye tadpegi." ("No matter how much someone ignores you, if you do these 3 things, they'll crave to talk to you.")
- **Scene count & pacing**: 4 beats in 46s: 0-9s hook+CTA, 10-21s Point 1 ("disappear temporarily"), 21-34s Point 2 ("walk away mid-conversation"), 35-46s Point 3 ("selectively share problems"). ~12s per point.
- **Payoff placement**: 0:35-0:46 — again the payoff is the final (3rd) list item, framed around self-worth/reserve, not a separate reveal after the list.
- **Structural trick**: Numbered listicle (1/2/3 badge overlays) + a **persistent header overlay** ("IGNORE POWER") that stays on screen the whole video, reinforcing the hook's promise throughout, layered under high-tempo pop-culture/anime character edits synced to the beat, not to the literal advice content.
- **Reusable takeaway**: A persistent on-screen header that restates the video's core promise (not just an opening hook line that disappears) may be a low-cost retention aid — worth testing as a caption-overlay convention for Ivy's videos, distinct from a spoken hook.

### ZIVROXY — "3 Psychology Signs That May Reveal Deception" (analyzed 2026-09-11)
- **Source**: https://www.youtube.com/watch?v=JRwbkBMLyGk
- **Analysis tool used**: Gemini (`gemini-3.6-flash`)
- **Views / channel age at time of analysis**: 1,043,811 views on this video; channel created 2026-02-09 → **214 days old**; 184 total videos, 41,116,347 total channel views → **true avg ≈ 223,458 views/video**
- **Hook (0-2s)**: Visual: text overlay "REVEAL DECEPTION" over B-roll of two wrenches prying open a padlock shackle. Spoken (Hindi): "Psychology kehti hai, agar koi tumse jhoot bol raha hai..." ("Psychology says, if someone is lying to you...")
- **Scene count & pacing**: Hook 0-4s → curiosity-gap line "3 signs they can't hide" 4-5s → explanatory tease 5-10s → mid-video subscribe CTA 10-14s ("last one is the most powerful") → Sign 1 (eye contact) 15-25s → Sign 2 (frozen body language) 25-36s → Sign 3 (information flood) 36-46s.
- **Payoff placement**: 0:36-0:46 — Sign 3 ("unprompted over-explaining = lying") is explicitly flagged mid-video as "the most powerful," pre-selling the payoff before it lands, then delivering it last.
- **Structural trick**: **Mid-hook subscribe CTA that also functions as a curiosity-gap escalator** — placed right before Sign 1, verbally promising the last point is the strongest, which manufactures a reason to keep watching through all 3 signs. Combined with continuous unrelated oddly-satisfying B-roll (car power-washing, egg-peeling, paint-mixing) under the entire voiceover.
- **Reusable takeaway**: Explicitly telling the viewer "the last one is the most powerful/important" partway through a listicle is a cheap, specific retention lever — different from a generic loop/callback ending, this is a mid-video promise about what's still coming. Worth testing verbatim in an Ivy script.

### PSYVEXS — "2 Dark Psychology Tricks To Read People" (analyzed 2026-09-11)
- **Source**: https://www.youtube.com/watch?v=dVSEofqLLRU
- **Analysis tool used**: Gemini (`gemini-3.6-flash`)
- **Views / channel age at time of analysis**: 21,041 views on this specific video (below the channel's own average — included anyway as a genuinely fresh, high-volume channel exemplar, not cherry-picked for this one video's number); channel created 2026-06-30 → **73 days old**; 95 total videos, 10,149,376 total channel views → **true avg ≈ 106,835 views/video**
- **Hook (0-2s)**: Visual: purple kinetic-sand block being sliced with a corrugated metal cutter; top text overlay "DARK PSYCHOLOGY". Spoken (Hindi): "Agar galat kaam par use nahi karoge, toh aaj mai tumhe dark psychology ke do aise khatarnak tricks batane wala hu..." ("If you won't misuse them, today I'll tell you two dangerous dark psychology tricks...")
- **Scene count & pacing**: 5 beats in 50s: 0-5s hook/warning framing, 5-18s ASMR sand-molding + "you can read anyone's mind" claim, 18-33s Trick 1 (people glance first at who they like when a group laughs), 33-44s Trick 2 (face/nose-touching + avoided eye contact = lying), 44-50s subscribe/comment CTA.
- **Payoff placement**: Two payoffs, one per trick (24-30s and 34-44s) rather than one big reveal at the end — a **2-point** list (shorter than the 3-point standard seen in the other 4 videos), each point is its own self-contained payoff.
- **Structural trick**: "Reverse-psychology" warning hook ("if you won't misuse this...") as a permission-granting frame before dark-psychology content, paired with the same ASMR-B-roll/unrelated-visual pattern seen across nearly every video in this sample.
- **Reusable takeaway**: A 2-point structure lands both "signs" as standalone payoffs rather than saving one big reveal for the end — useful variant to the standard 3-point list when the two insights are strong enough to each carry a beat alone; the "if you promise not to misuse this" framing device is a distinct hook variant worth testing for Ivy's darker/manipulation-adjacent premises.

### Better Years — "7 Dark Psychology Facts That Reveal More Than You Think" (analyzed 2026-09-11)
- **Source**: https://www.youtube.com/watch?v=1hGFVlfJonw
- **Analysis tool used**: Gemini (`gemini-3.6-flash`)
- **Views / channel age at time of analysis**: 40,728 views on this video; channel created 2026-08-14 → **28 days old** (the freshest channel in this sample) with an unusually high upload pace (94 videos in 28 days, ~3.4/day); 4,036,437 total channel views → **true avg ≈ 42,940 views/video**. Note: channel's broader niche is general wellness/longevity, not psychology-exclusive — this specific video is a psychology-facts crossover post, included because it's directly on-niche and genuinely fresh.
- **Hook (0-2s)**: This video is a **static text-only format, no voiceover** — header "DARK PSYCHOLOGY" over a calm tropical-dock loop background, with list item 1 already visible on screen at 0:00: "A person who gets angry frequently is often weak and, most of the time, a liar."
- **Scene count & pacing**: Only 3 beats across a 11-second video: 0-3s items 1-2 visible, 3-8s items 3-6 cycle through as static text, 8-10s item 7 = "If you're a fan of psychology, follow me."
- **Payoff placement**: No single payoff — this is a flat list-of-7 read entirely through on-screen text with no escalation or twist; the "payoff" is just the last item doubling as a follow CTA.
- **Structural trick**: **No voiceover at all** — pure text-over-ambient-loop format, letting the viewer read at their own pace. Radically different mechanism from the other 4 videos (which all use voiceover + B-roll): this one is optimized for silent/sound-off scrolling and reading speed rather than watch-through pacing.
- **Reusable takeaway**: A text-only, no-voiceover variant is a genuinely distinct low-cost format worth testing as an occasional format for Ivy (with her name/branding as the closing CTA line, matching this video's "follow me" close) — useful for sound-off feed contexts, but it sacrifices Ivy's persona voice, which is this channel's core differentiator, so should stay a minority format, not the default.

### Cross-video pattern summary (5 Gemini-analyzed videos, 2026-09-11)
- **Confirmed** (matches the earlier WebSearch-synthesis entry): direct-address ("you"/"tumhara") hooks land in the first 1-3 seconds in 4/5 videos; numbered-listicle format (2 or 3 points) is the dominant structure; final list item consistently carries the strongest payoff (back-loaded, not a separate reveal beat) in 4/5 videos.
- **Refined**: the earlier synthesis guessed a 40-55s "application beat" + a final loop/callback line — real videos in this niche are shorter (34-51s) and do **not** clearly use a callback/loop ending; instead the most common closer is a direct subscribe/follow/comment CTA. Loop/callback was not observed in any of the 5 real breakdowns — deprioritize that specific tactic pending further sampling.
- **New finding not in the original synthesis**: nearly every voiced video (4/5) pairs the spoken listicle with **completely unrelated oddly-satisfying/ASMR B-roll** (kinetic sand, soap scraping, car washing, egg peeling) — the visual track does not illustrate the advice at all. This is a cheap, reusable production pattern: Ivy's voiceover/text content can be written independently of a literal visual, as long as something visually satisfying/hypnotic is on screen.
- **New finding**: mid-video "the last one is the most powerful" verbal pre-sell (ZIVROXY) and a persistent on-screen header restating the hook (MINDORA) are two specific, concrete retention devices not captured in the earlier provisional entry.
- **Format outlier**: the Better Years no-voiceover, static-text format is a legitimate distinct sub-pattern worth testing occasionally, not a mistake in sampling — flatten it into a documented minority format rather than dismissing it.
