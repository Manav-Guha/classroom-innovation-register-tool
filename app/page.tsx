"use client";

import { useState } from "react";

const DIMENSIONS = [
  {
    key: "ideasAssumptions",
    label: "Ideas / Assumptions",
    description:
      "To what extent does this case challenge or revise prevailing ideas, assumptions, or beliefs about how military force should be generated, organised, or employed?",
  },
  {
    key: "commitmentsLockin",
    label: "Commitments / Lock-in",
    description:
      "How deeply does this case alter or break existing institutional commitments, sunk costs, procurement paths, or doctrinal lock-in?",
  },
  {
    key: "practiceDisruption",
    label: "Practice / Disruption",
    description:
      "To what extent does this case disrupt established operational practices, routines, training, or ways of fighting?",
  },
  {
    key: "expansionSpillover",
    label: "Expansion / Spillover",
    description:
      "Does this case expand beyond its original domain — spilling over into other services, allies, civilian sectors, or future conflicts?",
  },
] as const;

type DimensionKey = (typeof DIMENSIONS)[number]["key"];

type Scores = Record<DimensionKey, number>;

interface Challenge {
  tooHigh: string;
  tooLow: string;
  evidenceToDefend: string;
}

type Challenges = Record<DimensionKey, Challenge>;

interface Viability {
  verdict: "PASS" | "CONDITIONAL" | "FAIL" | "ERROR";
  reasoning: string;
}

const STEP_NAMES = [
  "Case Details",
  "Viability Gate",
  "Register Scores",
  "Dialectical Challenge",
  "Final Assessment",
] as const;

function getInterpretation(total: number): {
  band: string;
  description: string;
} {
  if (total <= 2)
    return {
      band: "Mostly an upgrade",
      description:
        "The case appears to be an upgrade or marginal improvement within existing frameworks. Prevailing ideas, commitments, and practices remain largely intact.",
    };
  if (total <= 5)
    return {
      band: "Adaptation or limited improvement",
      description:
        "The case reflects an adaptation or limited improvement. Some assumptions or practices are adjusted, but core commitments and structures persist.",
    };
  if (total <= 8)
    return {
      band: "Modernisation",
      description:
        "The case represents a modernisation effort that meaningfully revises ideas, disrupts some practices, or loosens institutional lock-in, though it may not spill over broadly.",
    };
  if (total <= 10)
    return {
      band: "Probable innovation",
      description:
        "The case demonstrates probable innovation — significantly challenging prevailing assumptions, breaking commitments, disrupting practices, or expanding into new domains.",
    };
  return {
    band: "Transformative or revolutionary change",
    description:
      "The case represents transformative or revolutionary change across most registers, fundamentally rewriting ideas, commitments, practices, and spilling over well beyond the original domain.",
  };
}

const SCORE_LABELS: Record<number, string> = {
  0: "None / negligible",
  1: "Minor / limited",
  2: "Significant / substantial",
  3: "Transformative / fundamental",
};

export default function Home() {
  // Stepped navigation (1–5). State stays in this parent so navigating
  // between steps never discards entered data.
  const [step, setStep] = useState(1);

  // Case details
  const [caseTitle, setCaseTitle] = useState("");
  const [year, setYear] = useState("");
  const [actor, setActor] = useState("");
  const [description, setDescription] = useState("");
  const [claimedInnovation, setClaimedInnovation] = useState("");

  // Viability gate
  const [viability, setViability] = useState<Viability | null>(null);
  const [viabilityLoading, setViabilityLoading] = useState(false);
  const [viabilityError, setViabilityError] = useState("");

  // Scores
  const [scores, setScores] = useState<Scores>({
    ideasAssumptions: 0,
    commitmentsLockin: 0,
    practiceDisruption: 0,
    expansionSpillover: 0,
  });

  // Challenge
  const [challenges, setChallenges] = useState<Challenges | null>(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengeError, setChallengeError] = useState("");

  // Student reflection
  const [finalScores, setFinalScores] = useState<Scores>({
    ideasAssumptions: 0,
    commitmentsLockin: 0,
    practiceDisruption: 0,
    expansionSpillover: 0,
  });
  const [reflection, setReflection] = useState("");

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const finalTotal = Object.values(finalScores).reduce((a, b) => a + b, 0);
  const interpretation = getInterpretation(totalScore);
  const finalInterpretation = getInterpretation(finalTotal);

  const viabilityPassed =
    viability?.verdict === "PASS" || viability?.verdict === "CONDITIONAL";
  const isConditional = viability?.verdict === "CONDITIONAL";

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  function goNext() {
    setStep((s) => Math.min(STEP_NAMES.length, s + 1));
  }

  function updateScore(key: DimensionKey, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  function updateFinalScore(key: DimensionKey, value: number) {
    setFinalScores((prev) => ({ ...prev, [key]: value }));
  }

  async function requestViability() {
    if (!caseTitle.trim()) {
      setViabilityError(
        "Please enter a case title before assessing viability."
      );
      return;
    }

    setViabilityLoading(true);
    setViabilityError("");
    setViability(null);

    try {
      const res = await fetch("/api/viability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: caseTitle, year, description }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      setViability({ verdict: data.verdict, reasoning: data.reasoning });
    } catch (err) {
      setViabilityError(
        err instanceof Error ? err.message : "Failed to assess viability."
      );
    } finally {
      setViabilityLoading(false);
    }
  }

  async function requestChallenge() {
    if (!caseTitle.trim()) {
      setChallengeError("Please enter a case title before requesting a challenge.");
      return;
    }

    setChallengeLoading(true);
    setChallengeError("");
    setChallenges(null);

    try {
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseTitle,
          year,
          actor,
          description,
          claimedInnovation,
          scores,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      setChallenges(data.challenges);
      // Pre-fill final scores with initial scores so students can adjust
      setFinalScores({ ...scores });
    } catch (err) {
      setChallengeError(
        err instanceof Error ? err.message : "Failed to generate challenge."
      );
    } finally {
      setChallengeLoading(false);
    }
  }

  return (
    <>
      {/* Interactive stepped UI — hidden when printing (see globals.css). */}
      <div className="app-screen mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Progress indicator */}
        <nav
          className="flex flex-wrap gap-2 text-xs"
          aria-label="Progress through the assessment"
        >
          {STEP_NAMES.map((name, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <div
                key={name}
                aria-current={active ? "step" : undefined}
                className={`flex items-center gap-1.5 rounded px-2 py-1 ${
                  active
                    ? "bg-blue-600 text-white font-semibold"
                    : done
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    active
                      ? "bg-white text-blue-600"
                      : done
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {n}
                </span>
                <span>{name}</span>
              </div>
            );
          })}
        </nav>

        {/* Step 1: Case Details */}
        {step === 1 && (
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">
              1. Case Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Case Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  placeholder="e.g. Blitzkrieg"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 1940"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actor / Country
                </label>
                <input
                  type="text"
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                  placeholder="e.g. Germany"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Briefly describe the case and its context..."
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Claimed Innovation
                </label>
                <textarea
                  value={claimedInnovation}
                  onChange={(e) => setClaimedInnovation(e.target.value)}
                  rows={2}
                  placeholder="What is the innovation being claimed?"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
                />
              </div>
            </div>
          </section>
        )}

        {/* Step 2: Viability Gate */}
        {step === 2 && (
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">
              2. Viability Gate
            </h2>
            <p className="text-sm text-gray-500">
              Before scoring can begin, the case concept must be assessed for
              viability by its target year. The assessment separates technical
              possibility from operational feasibility and returns a verdict of
              Pass, Conditional, or Fail. You cannot advance until the verdict is
              Pass or Conditional.
            </p>

            <button
              onClick={requestViability}
              disabled={viabilityLoading}
              className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {viabilityLoading ? "Assessing viability..." : "Assess Viability"}
            </button>

            {viabilityError && (
              <p className="text-sm text-red-600">{viabilityError}</p>
            )}

            {viability && (
              <div
                className={`rounded border p-4 space-y-3 ${
                  viability.verdict === "PASS"
                    ? "border-green-300 bg-green-50"
                    : viability.verdict === "CONDITIONAL"
                    ? "border-amber-300 bg-amber-50"
                    : viability.verdict === "FAIL"
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                <span
                  className={`block text-sm font-bold ${
                    viability.verdict === "PASS"
                      ? "text-green-700"
                      : viability.verdict === "CONDITIONAL"
                      ? "text-amber-700"
                      : viability.verdict === "FAIL"
                      ? "text-red-700"
                      : "text-gray-700"
                  }`}
                >
                  {viability.verdict === "ERROR"
                    ? "Assessment incomplete"
                    : `Verdict: ${viability.verdict}`}
                </span>

                {viability.verdict === "PASS" && (
                  <p className="text-xs text-green-800">
                    ✓ Viability passed. Press Next to proceed to the register
                    scores.
                  </p>
                )}
                {viability.verdict === "CONDITIONAL" && (
                  <p className="text-xs text-amber-800">
                    ⚠ Viable with a caveat. This concept is viable only under a
                    stated condition (below). You may proceed, but carry that
                    limitation into your scoring.
                  </p>
                )}
                {viability.verdict === "FAIL" && (
                  <p className="text-xs text-red-800">
                    ⛔ Viability failed. You cannot advance. Revise the concept
                    or change the target year, then re-assess.
                  </p>
                )}
                {viability.verdict === "ERROR" && (
                  <p className="text-xs text-gray-700">
                    Could not assess viability — the model did not return a clear
                    verdict. You cannot advance; please try again.
                  </p>
                )}

                {viability.reasoning && (
                  <p className="rounded bg-white/70 p-3 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {viability.reasoning}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Step 3: Register Scoring */}
        {step === 3 && (
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
            <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">
              3. Innovation Register Scores
            </h2>
            <p className="text-sm text-gray-500">
              Score each dimension from 0 (none/negligible) to 3
              (transformative/fundamental).
            </p>

            {isConditional && (
              <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <span className="font-semibold">
                  ⚠ Conditional viability — score with this caveat in mind:
                </span>
                {viability?.reasoning && (
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                    {viability.reasoning}
                  </p>
                )}
              </div>
            )}

            {DIMENSIONS.map((dim) => (
              <div key={dim.key} className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    {dim.label}
                  </label>
                  <span className="text-xs text-gray-400">
                    {scores[dim.key]}/3 &mdash; {SCORE_LABELS[scores[dim.key]]}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{dim.description}</p>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map((val) => (
                    <button
                      key={val}
                      onClick={() => updateScore(dim.key, val)}
                      className={`flex-1 rounded border py-1.5 text-sm font-medium transition-colors ${
                        scores[dim.key] === val
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Cumulative score & interpretation */}
            <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  Cumulative Score
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {totalScore} / 12
                </span>
              </div>
              <div className="mt-2">
                <span className="inline-block rounded bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                  {interpretation.band}
                </span>
                <p className="mt-1 text-xs text-gray-600">
                  {interpretation.description}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Step 4: Dialectical Challenge */}
        {step === 4 && (
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">
              4. Dialectical Challenge
            </h2>
            <p className="text-sm text-gray-500">
              Request an AI-generated challenge to your scores. The system will
              argue why each score may be too high, too low, and what evidence
              would defend it.
            </p>

            <button
              onClick={requestChallenge}
              disabled={challengeLoading}
              className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {challengeLoading ? "Generating challenge..." : "Generate Challenge"}
            </button>

            {challengeError && (
              <p className="text-sm text-red-600">{challengeError}</p>
            )}

            {challenges && (
              <div className="space-y-4 mt-2">
                {DIMENSIONS.map((dim) => {
                  const c = challenges[dim.key];
                  if (!c) return null;
                  return (
                    <div
                      key={dim.key}
                      className="rounded border border-gray-200 bg-gray-50 p-4 space-y-3"
                    >
                      <h3 className="text-sm font-semibold text-gray-800">
                        {dim.label}{" "}
                        <span className="font-normal text-gray-500">
                          (your score: {scores[dim.key]}/3)
                        </span>
                      </h3>

                      <div>
                        <p className="text-xs font-semibold text-red-700 mb-0.5">
                          Why the score may be too high:
                        </p>
                        <p className="text-xs text-gray-700">{c.tooHigh}</p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-0.5">
                          Why the score may be too low:
                        </p>
                        <p className="text-xs text-gray-700">{c.tooLow}</p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-blue-700 mb-0.5">
                          Evidence that would defend the score:
                        </p>
                        <p className="text-xs text-gray-700">
                          {c.evidenceToDefend}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Step 5: Student Reflection & Final Scores */}
        {step === 5 && (
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-base font-semibold text-gray-800">
                5. Final Assessment &amp; Reflection
              </h2>
              <button
                onClick={() => window.print()}
                className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Download PDF
              </button>
            </div>
            <p className="text-sm text-gray-500">
              After reviewing the dialectical challenge, adjust your scores if
              needed and record your reflection. Use Download PDF to print or
              save the full record.
            </p>

            {DIMENSIONS.map((dim) => (
              <div key={dim.key} className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    {dim.label}
                  </label>
                  <span className="text-xs text-gray-400">
                    {finalScores[dim.key]}/3 &mdash;{" "}
                    {SCORE_LABELS[finalScores[dim.key]]}
                    {finalScores[dim.key] !== scores[dim.key] && (
                      <span className="ml-1 text-amber-600">
                        (was {scores[dim.key]})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map((val) => (
                    <button
                      key={val}
                      onClick={() => updateFinalScore(dim.key, val)}
                      className={`flex-1 rounded border py-1.5 text-sm font-medium transition-colors ${
                        finalScores[dim.key] === val
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Final cumulative score */}
            <div className="rounded border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  Final Cumulative Score
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {finalTotal} / 12
                  {finalTotal !== totalScore && (
                    <span className="ml-2 text-sm font-normal text-amber-600">
                      (initial: {totalScore})
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-2">
                <span className="inline-block rounded bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                  {finalInterpretation.band}
                </span>
                <p className="mt-1 text-xs text-gray-600">
                  {finalInterpretation.description}
                </p>
              </div>
            </div>

            {/* Reflection text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Reflection
              </label>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={5}
                placeholder="Reflect on the dialectical challenge. Did it change your assessment? Why or why not? What did you learn about how innovation is assessed?"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
              />
            </div>
          </section>
        )}

        {/* Back / Next controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={goBack}
            disabled={step === 1}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>
          {step < STEP_NAMES.length && (
            <button
              onClick={goNext}
              disabled={step === 2 && !viabilityPassed}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>

      {/*
        Print-only record. Hidden on screen, shown only when printing (see
        globals.css). The stepped UI keeps only the active step in the DOM, so
        the full record is reproduced here as static, read-only content. Blank
        fields print empty; no step needs to be complete.
      */}
      <div className="print-summary">
        <h1>Military Innovation Analysis</h1>
        <p className="tagline">
          A Teaching Instrument for Analysing Military Innovation
        </p>

        <h2>1. Case Details</h2>
        <dl>
          <dt>Case Title</dt>
          <dd>{caseTitle}</dd>
          <dt>Year</dt>
          <dd>{year}</dd>
          <dt>Actor / Country</dt>
          <dd>{actor}</dd>
          <dt>Short Description</dt>
          <dd>{description}</dd>
          <dt>Claimed Innovation</dt>
          <dd>{claimedInnovation}</dd>
        </dl>

        <h2>2. Viability</h2>
        <p>
          <strong>Verdict: </strong>
          {viability ? viability.verdict : "Not assessed"}
        </p>
        {viability?.reasoning && (
          <p className="reasoning">{viability.reasoning}</p>
        )}

        <h2>3. Initial Register Scores</h2>
        <ul>
          {DIMENSIONS.map((dim) => (
            <li key={dim.key}>
              {dim.label}: {scores[dim.key]} / 3 — {SCORE_LABELS[scores[dim.key]]}
            </li>
          ))}
        </ul>
        <p>
          <strong>Cumulative: </strong>
          {totalScore} / 12 — {interpretation.band}
        </p>
        <p>{interpretation.description}</p>

        <h2>4. Dialectical Challenge</h2>
        {challenges ? (
          DIMENSIONS.map((dim) => {
            const c = challenges[dim.key];
            if (!c) return null;
            return (
              <div key={dim.key} className="challenge">
                <h3>
                  {dim.label} (score: {scores[dim.key]} / 3)
                </h3>
                <p>
                  <strong>Why the score may be too high: </strong>
                  {c.tooHigh}
                </p>
                <p>
                  <strong>Why the score may be too low: </strong>
                  {c.tooLow}
                </p>
                <p>
                  <strong>Evidence that would defend the score: </strong>
                  {c.evidenceToDefend}
                </p>
              </div>
            );
          })
        ) : (
          <p>Not generated.</p>
        )}

        <h2>5. Final Assessment &amp; Reflection</h2>
        <ul>
          {DIMENSIONS.map((dim) => (
            <li key={dim.key}>
              {dim.label}: {finalScores[dim.key]} / 3 —{" "}
              {SCORE_LABELS[finalScores[dim.key]]}
            </li>
          ))}
        </ul>
        <p>
          <strong>Final Cumulative: </strong>
          {finalTotal} / 12 — {finalInterpretation.band}
        </p>
        <p>{finalInterpretation.description}</p>
        <h3>Student Reflection</h3>
        <p className="reflection">{reflection}</p>

        <p className="copyright print-footer">© Manabrata Guha, 2026</p>
      </div>
    </>
  );
}
