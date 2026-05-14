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
  // Case details
  const [caseTitle, setCaseTitle] = useState("");
  const [year, setYear] = useState("");
  const [actor, setActor] = useState("");
  const [description, setDescription] = useState("");
  const [claimedInnovation, setClaimedInnovation] = useState("");

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

  function updateScore(key: DimensionKey, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  function updateFinalScore(key: DimensionKey, value: number) {
    setFinalScores((prev) => ({ ...prev, [key]: value }));
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
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      {/* Section 1: Case Details */}
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

      {/* Section 2: Register Scoring */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">
          2. Innovation Register Scores
        </h2>
        <p className="text-sm text-gray-500">
          Score each dimension from 0 (none/negligible) to 3
          (transformative/fundamental).
        </p>

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

      {/* Section 3: Dialectical Challenge */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">
          3. Dialectical Challenge
        </h2>
        <p className="text-sm text-gray-500">
          Request an AI-generated challenge to your scores. The system will
          argue why each score may be too high, too low, and what evidence would
          defend it.
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

      {/* Section 4: Student Reflection & Final Scores */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">
          4. Final Assessment &amp; Reflection
        </h2>
        <p className="text-sm text-gray-500">
          After reviewing the dialectical challenge, adjust your scores if
          needed and record your reflection.
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
    </div>
  );
}
