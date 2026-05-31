import { NextRequest, NextResponse } from "next/server";

interface ViabilityRequest {
  concept: string;
  year: string;
  description: string;
}

// Verbatim viability prompt. {{CONCEPT}}, {{YEAR}}, {{DESCRIPTION}} are
// substituted at request time; the prompt text itself is unchanged.
const VIABILITY_PROMPT_TEMPLATE = `You are a defence science and technology assessor. Your task is to judge whether a
proposed military capability is VIABLE by a stated target year. You are a gate, not a
cheerleader: your job is to stop infeasible concepts from proceeding, so apply scrutiny.

PROPOSED CAPABILITY: {{CONCEPT}}
TARGET YEAR: {{YEAR}}
DESCRIPTION (optional, may be blank): {{DESCRIPTION}}

== THE DISTINCTION YOU MUST ENFORCE ==
Viability has two separate tests, and a concept must satisfy BOTH:

1. TECHNICAL POSSIBILITY — Can the underlying science and engineering actually deliver
   the claimed effect at all? This is about physics and demonstrated/achievable technology,
   not deployment. A concept fails here if it depends on a mechanism that does not work for
   the stated application, or on a technological maturity that cannot plausibly be reached
   by the target year given the trajectory from today.

2. OPERATIONAL FEASIBILITY — Even if technically possible, could this be fielded, sustained,
   crewed, supplied, maintained, and actually used as a military capability by the target
   year? Consider logistics, infrastructure, safety, cost at scale, training, doctrine fit,
   and political/legal constraints. A concept that is buildable in a lab but cannot function
   as a deployed capability fails here.

A concept that is technically possible but operationally unfeasible is NOT viable.

== CALIBRATION (apply this exact reasoning) ==
- A fighter aircraft propelled by an ion engine, target year 2026: FAIL. Ion propulsion
  produces negligible thrust in atmosphere; it does not work for the stated application.
  Fails TECHNICAL POSSIBILITY.
- A nuclear-powered crewed aircraft, target year 2026: FAIL. It is technically demonstrated
  (US NB-36H, Soviet Tu-95LAL flew with reactors aboard), so it passes TECHNICAL POSSIBILITY,
  but reactor shielding weight, crash-contamination risk, maintenance burden, and the
  absence of any operational deployment pathway make it operationally unfeasible. Fails
  OPERATIONAL FEASIBILITY.
- A coordinated swarm of small autonomous strike drones, target year 2026: PASS. The
  enabling technology exists and is fielded; scaling and coordination are engineering
  problems, not barriers of possibility or basic feasibility.

== ASSESS AGAINST FOUR CRITERIA ==
For the TARGET YEAR, evaluate each and state a short finding:
A. Physical plausibility — does it violate or strain known physics?
B. Technical achievability by {{YEAR}} — is the required maturity reachable on trajectory?
C. Resource feasibility — cost, materials, industrial base, energy at deployable scale.
D. Operational compatibility — can it be crewed, sustained, integrated, and lawfully used?

== DECISION RULE ==
- PASS: all four criteria are satisfied for {{YEAR}}.
- FAIL: any criterion is decisively violated (impossible physics, unreachable maturity,
  or a disqualifying operational barrier such as the nuclear-aircraft case).
- CONDITIONAL: technically possible and broadly feasible, but contingent on a specific
  assumption, breakthrough, or relaxation that is plausible-but-not-assured by {{YEAR}}.
  State the condition explicitly.

== OUTPUT FORMAT ==
Write 3–6 sentences of reasoning that explicitly separate technical possibility from
operational feasibility and reference the relevant criteria. Then, on its own final line,
output exactly one of:
VERDICT: PASS
VERDICT: CONDITIONAL
VERDICT: FAIL`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let body: ViabilityRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { concept, year, description } = body;

  if (!concept) {
    return NextResponse.json(
      { error: "Missing required field: concept." },
      { status: 400 }
    );
  }

  const prompt = VIABILITY_PROMPT_TEMPLATE.replaceAll("{{CONCEPT}}", concept)
    .replaceAll("{{YEAR}}", year || "Not specified")
    .replaceAll("{{DESCRIPTION}}", description || "");

  try {
    const geminiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { error: "Failed to get response from Gemini." },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText: string = (geminiData?.candidates?.[0]?.content?.parts ?? [])
      .map((p: { text?: string }) => p?.text ?? "")
      .join("")
      .trim();

    // Parse ONLY the final-line verdict — do not scan the body for phrases.
    const verdictMatch = rawText.match(
      /^VERDICT:\s*(PASS|CONDITIONAL|FAIL)/im
    );
    if (!verdictMatch) {
      // A missing/unparseable verdict is not an upstream failure. Degrade
      // gracefully so the UI can show a "could not assess — try again" state.
      return NextResponse.json({ verdict: "ERROR", reasoning: rawText });
    }

    const verdict = verdictMatch[1].toUpperCase();
    const reasoning = rawText
      .replace(/^VERDICT:\s*(PASS|CONDITIONAL|FAIL).*$/im, "")
      .trim();

    return NextResponse.json({ verdict, reasoning });
  } catch (err) {
    console.error("Viability API error:", err);
    return NextResponse.json(
      { error: "Internal server error generating viability assessment." },
      { status: 500 }
    );
  }
}
