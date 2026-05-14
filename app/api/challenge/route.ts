import { NextRequest, NextResponse } from "next/server";

interface ChallengeRequest {
  caseTitle: string;
  year: string;
  actor: string;
  description: string;
  claimedInnovation: string;
  scores: {
    ideasAssumptions: number;
    commitmentsLockin: number;
    practiceDisruption: number;
    expansionSpillover: number;
  };
}

const DIMENSION_LABELS: Record<string, string> = {
  ideasAssumptions: "Ideas / Assumptions",
  commitmentsLockin: "Commitments / Lock-in",
  practiceDisruption: "Practice / Disruption",
  expansionSpillover: "Expansion / Spillover",
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let body: ChallengeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { caseTitle, year, actor, description, claimedInnovation, scores } =
    body;

  if (!caseTitle || !scores) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  const scoreLines = Object.entries(scores)
    .map(
      ([key, val]) =>
        `- ${DIMENSION_LABELS[key] || key}: ${val}/3`
    )
    .join("\n");

  const prompt = `You are a classroom teaching assistant helping students critically evaluate their assessment of a military innovation case. Be concise and educational.

The student is using four registers to assess whether a case constitutes genuine innovation. These registers deliberately avoid equating innovation with technology or newness. Instead they ask whether the case challenges ideas, breaks commitments, disrupts practices, and spills over into new domains.

The four registers are:
- Ideas / Assumptions: Does this case challenge or revise prevailing ideas, assumptions, or beliefs about how military force should be generated, organised, or employed?
- Commitments / Lock-in: Does this case alter or break existing institutional commitments, sunk costs, procurement paths, or doctrinal lock-in?
- Practice / Disruption: Does this case disrupt established operational practices, routines, training, or ways of fighting?
- Expansion / Spillover: Does this case expand beyond its original domain — spilling over into other services, allies, civilian sectors, or future conflicts?

Case details:
- Title: ${caseTitle}
- Year: ${year || "Not specified"}
- Actor/Country: ${actor || "Not specified"}
- Description: ${description || "Not provided"}
- Claimed Innovation: ${claimedInnovation || "Not provided"}

Student scores (each on a 0–3 scale):
${scoreLines}
Cumulative score: ${Object.values(scores).reduce((a, b) => a + b, 0)}/12

For EACH of the four registers, provide a dialectical challenge with exactly three parts:
1. **Why the score may be too high** — identify reasons the student may have over-scored this register.
2. **Why the score may be too low** — identify reasons the student may have under-scored this register.
3. **What evidence would defend the score** — suggest specific historical evidence or arguments that would justify the chosen score.

Format your response as JSON with this structure:
{
  "challenges": {
    "ideasAssumptions": {
      "tooHigh": "...",
      "tooLow": "...",
      "evidenceToDefend": "..."
    },
    "commitmentsLockin": {
      "tooHigh": "...",
      "tooLow": "...",
      "evidenceToDefend": "..."
    },
    "practiceDisruption": {
      "tooHigh": "...",
      "tooLow": "...",
      "evidenceToDefend": "..."
    },
    "expansionSpillover": {
      "tooHigh": "...",
      "tooLow": "...",
      "evidenceToDefend": "..."
    }
  }
}

Return ONLY the JSON object, no other text.`;

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
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
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response (Gemini may wrap it in markdown code fences)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse Gemini response." },
        { status: 502 }
      );
    }

    const challenges = JSON.parse(jsonMatch[0]);
    return NextResponse.json(challenges);
  } catch (err) {
    console.error("Challenge API error:", err);
    return NextResponse.json(
      { error: "Internal server error generating challenge." },
      { status: 500 }
    );
  }
}
