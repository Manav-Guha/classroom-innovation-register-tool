# App Specification — Classroom Innovation Register

## Purpose

A simplified classroom teaching tool that helps students assess military innovation cases using a structured register of four broad dimensions scored 0–3, with AI-generated dialectical challenges to promote critical thinking.

This is a pedagogical exercise only. It does not reproduce or implement any proprietary research framework, scoring methodology, or analytical architecture.

## Features

### 1. Case Input

Students enter details about the military innovation case:

- **Case Title** (required) — e.g. "Blitzkrieg"
- **Year** — e.g. "1940"
- **Actor / Country** — e.g. "Germany"
- **Short Description** — brief context for the case
- **Claimed Innovation** — what innovation is being asserted

### 2. Register Scoring (four dimensions, each 0–3)

| Score | Label |
|-------|-------|
| 0 | None / negligible |
| 1 | Minor / limited |
| 2 | Significant / substantial |
| 3 | Transformative / fundamental |

**Registers:**

1. **Ideas / Assumptions** — Does this case challenge or revise prevailing ideas, assumptions, or beliefs about how military force should be generated, organised, or employed?
2. **Commitments / Lock-in** — Does this case alter or break existing institutional commitments, sunk costs, procurement paths, or doctrinal lock-in?
3. **Practice / Disruption** — Does this case disrupt established operational practices, routines, training, or ways of fighting?
4. **Expansion / Spillover** — Does this case expand beyond its original domain — spilling over into other services, allies, civilian sectors, or future conflicts?

These registers deliberately avoid equating innovation with technology or newness.

### 3. Cumulative Score & Interpretation Bands

The four scores are summed to a cumulative score out of 12. Soft interpretation bands:

| Range | Band |
|-------|------|
| 0–2 | Mostly an upgrade |
| 3–5 | Adaptation or limited improvement |
| 6–8 | Modernisation |
| 9–10 | Probable innovation |
| 11–12 | Transformative or revolutionary change |

These bands are soft interpretive guides, not thresholds.

### 4. Dialectical Challenge (Gemini-powered)

On request, the app sends the case details and scores to Google's Gemini API, which returns a structured challenge for each register:

- **Why the score may be too high** — potential over-scoring reasons
- **Why the score may be too low** — potential under-scoring reasons
- **What evidence would defend the score** — historical evidence or arguments

### 5. Student Final Assessment & Reflection

After reviewing the challenge, students can:

- Adjust their scores (final scores shown alongside initial scores)
- Write a free-text reflection on what they learned

## Technical Stack

- Next.js (App Router)
- React 19
- Tailwind CSS v4
- Google Gemini API (via server-side API route)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key for dialectical challenge generation |

## Boundaries

This app does **not** include:

- MIAF terminology or sub-elements
- 0–5 scoring scales
- Normalised scoring or weighting
- Proprietary threshold logic
- PPTO engine or WAAP logic
- Historical case calibration database
- Adversarial multi-LLM architecture
- Domain-agnostic claims
