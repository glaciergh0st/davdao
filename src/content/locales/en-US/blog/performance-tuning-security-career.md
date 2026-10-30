```json
{
  "title": "Performance tuning for a security career",
  "metaTitle": "Performance tuning for a security career",
  "metaDescription": "The five-habit routine I use to keep improving in security: stay informed, build, practice, engage, and train, tracked honestly so the hours compound.",
  "slug": "performance-tuning-security-career",
  "openGraphImagePrompt": "A restrained technical illustration on a charcoal background: five small habit loops linked into one larger cycle, with a simple log or ledger beside them; muted blue, teal, and a little violet; editorial, precise, no logos, no text, no neon.",
  "tags": ["Career Development", "Continuous Learning", "Threat Intelligence", "CTF", "Detection Engineering"],
  "keyTakeaway": "Five habits keep me sharp: stay informed, build, practice, engage, and train. The value is in running them on a schedule and tracking them honestly, so the hours compound instead of scattering.",
  "summary": "The five-habit routine I run to keep improving as a security professional, staying informed, building, practicing, engaging, and training.",
  "author": "David Awosusi",
  "category": "Career Development",
  "publishedAt": "2026-10-29",
  "updatedAt": "2026-10-29",
  "visual": {
    "title": "The Loop",
    "caption": "Five habits on rotation. I keep each one small and regular instead of cramming it all at once.",
    "steps": [
      { "label": "Stay informed", "detail": "Feeds, CISA and the KEV catalog, vendor reports, GitHub trends, podcasts, and a few SMEs, checked on a rhythm." },
      { "label": "Build", "detail": "Tools, exploit work, and projects that turn what I read into something I can explain." },
      { "label": "Practice", "detail": "Weekly reps on Hack The Box, Proving Grounds, pwnedlabs, and detection labs." },
      { "label": "Engage", "detail": "Responsible disclosure, CTFs, writing, networking, and my local security chapter." },
      { "label": "Train", "detail": "Antisiphon, SANS, and Black Hat, when paid training is worth the money." }
    ]
  },
  "schema": {
    "title": "Where the time and money go",
    "caption": "Most of this costs only time. I pay for the few things free resources can't cover, then track the output so I know it's working.",
    "joinLabel": "feeds",
    "standards": [
      {
        "name": "No-cost",
        "fields": [
          { "name": "CISA / KEV", "meaning": "What's being exploited right now" },
          { "name": "GitHub trending", "meaning": "New offensive and defensive tooling" },
          { "name": "HTB (free)", "meaning": "Weekly hands-on reps" },
          { "name": "Podcasts & SMEs", "meaning": "Context and direction on commute time" }
        ]
      },
      {
        "name": "Paid",
        "fields": [
          { "name": "SANS", "meaning": "Deep, structured training on a topic" },
          { "name": "Antisiphon", "meaning": "Pay-what-you-can live training" },
          { "name": "Lab subscriptions", "meaning": "pwnedlabs, Proving Grounds, HTB VIP" },
          { "name": "Black Hat", "meaning": "Research and the hallway track" }
        ]
      }
    ],
    "output": {
      "name": "What I track",
      "fields": ["Hours logged", "Labs completed", "Write-ups shipped", "People met", "Certs in progress"]
    }
  }
}
```

## Why I treat this like tuning a system

I think about my career the way I think about a noisy SIEM. If I don't tune the inputs, I drown in noise and miss the signal that matters. So I run on a short routine instead of chasing whatever lands in my feed that day.

None of the habits below are new, and none of them are clever. What makes them work is doing them on a schedule and writing down what I actually did. Here is the loop.

## Stay informed

I keep a small set of inputs and check them on a rhythm so I'm not reacting to everything at once.

- Newsletters and threat-intel alerts for the day's signal.
- CISA advisories and the KEV catalog for what is being exploited now.
- Vendor reports when I want depth on a specific campaign.
- GitHub security trends to catch new tooling early, so I can test it and build defenses before it is everywhere.
- A few SMEs I follow by name, plus two or three podcasts for commute time.
- Dark web monitoring for exposure that touches me or a client.

The aim is a current picture of the threat landscape without living in my feed all day.

## Build

Reading alone doesn't make anything stick for me. I build so it does.

- Small tools and scripts that solve a problem I actually hit.
- Exploit work, so I understand a technique from the attacker's side.
- Projects I can point to, like my detection lab and the PID-integrity detector.
- The occasional security-product idea, taken far enough to learn from and then set down.

Building is what turns something I read into something I can explain to someone else.

## Practice

Hands-on reps, every week.

- Hack The Box for breadth across Windows, Linux, and Active Directory.
- OffSec Proving Grounds when I want exam-style pressure.
- pwnedlabs for cloud attack and defense.
- Detection-focused labs for the blue-team side, so I can catch what I just learned to do.

I log every lab in my SkillJar, with the hours and the skill it built. That keeps me honest about where the time went and shows me the domains I have been avoiding.

## Engage

The work doesn't count for much if nobody can see it, so I put it out in the open.

- Responsible disclosure when I find something real.
- CTFs for pressure, and for meeting people who are sharper than me.
- Writing here, which forces me to get the details right before I publish.
- Networking and showing up to my local security chapter.

Visibility and credibility come from showing the work consistently, over a long stretch rather than one good week.

## Train

I pay for training when I've gone as far as free resources take me.

- Antisiphon for pay-what-you-can live courses that fit around work.
- SANS training when I want to go deep on a specific topic with structured material.
- Black Hat for the research and the hallway conversations that don't happen anywhere else.

I keep this budget small and deliberate, since most of the routine above costs only time and attention.

## A version you can run yourself

That's my routine. If you want to build your own, here is a cadence to start from. Adjust the frequency to your life. The only rule worth keeping is logging what you actually did, so you can see the gaps instead of guessing at them.

| Habit | Cadence | What to actually do |
| --- | --- | --- |
| Stay informed | Daily, 15 min | Skim one newsletter and the CISA KEV catalog; save anything relevant to dig into later. |
| Build | Weekly | Ship one small thing, a script, a tool, or a written note, from what you read that week. |
| Practice | Weekly | Finish one lab end to end; log the hours and the skill it built. |
| Engage | Monthly | Publish one write-up, play one CTF, or show up to one meetup; disclose anything real you find. |
| Train | Quarterly | Book one paid course or conference once you've outgrown the free options. |
| Review | Weekly, 10 min | Look back at your log, mark which habits you dropped, and start next week from the gap. |

Start with two rows and add the rest once those two are automatic. A small routine you keep beats a big one you abandon in week three.

### Options to pick from

Everyone's stack looks a little different. Here are solid options under each habit; choose what fits your role, your budget, and your time.

- **Stay informed:** CISA KEV and advisories; newsletters like tl;dr sec, Risky Biz News, or SANS NewsBites; podcasts like Risky Business, Darknet Diaries, or Malicious Life; GitHub trending and vendor threat reports.
- **Build:** a public GitHub repo for your scripts and notes; a home lab; contributing to an open-source security project; turning a technique you just learned into a detection or a small tool.
- **Practice:** Hack The Box, OffSec Proving Grounds, pwnedlabs, TryHackMe, CyberDefenders, Blue Team Labs Online, RangeForce, or Splunk BOTS.
- **Engage:** a blog; your local OWASP chapter, DEF CON group, or BSides; CTFs; responsible disclosure and bug bounty; submitting a talk to a CFP.
- **Train:** Antisiphon and Black Hills, SANS, TCM Security, Zero-Point Security, or OffSec; conferences like Black Hat, DEF CON, or a regional BSides.

## Keeping it honest

The checklist only works if I am honest about what I did, not what I meant to do. That is why I track the hours and the output instead of trusting my memory of a busy month. Some weeks I hit all five. Most weeks I hit three. The point is that the log tells me which two I dropped, so the next week has somewhere to start.
