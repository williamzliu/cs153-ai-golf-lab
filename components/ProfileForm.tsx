"use client";

import { useState } from "react";
import { PlayerProfile } from "@/lib/prompt";

interface ProfileFormProps {
  onSubmit: (profile: PlayerProfile) => void;
  initialValues?: PlayerProfile;
}

export default function ProfileForm({ onSubmit, initialValues }: ProfileFormProps) {
  const [handicap, setHandicap] = useState(initialValues?.handicap ?? "");
  const [typicalMiss, setTypicalMiss] = useState(initialValues?.typicalMiss ?? "");
  const [currentGoal, setCurrentGoal] = useState(initialValues?.currentGoal ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ handicap, typicalMiss, currentGoal });
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="inline-block text-5xl mb-3">⛳</span>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
            AI Golf Lab
          </h1>
          <p className="mt-2 text-stone-500 text-sm">
            Tell your coach about your game to get personalized advice.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-stone-200 rounded-2xl shadow-sm p-8 space-y-6"
        >
          <div>
            <label
              htmlFor="handicap"
              className="block text-sm font-medium text-stone-700 mb-1"
            >
              Handicap
            </label>
            <input
              id="handicap"
              type="text"
              value={handicap}
              onChange={(e) => setHandicap(e.target.value)}
              placeholder="e.g. 18, scratch, beginner"
              required
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="typicalMiss"
              className="block text-sm font-medium text-stone-700 mb-1"
            >
              Typical miss
            </label>
            <input
              id="typicalMiss"
              type="text"
              value={typicalMiss}
              onChange={(e) => setTypicalMiss(e.target.value)}
              placeholder="e.g. slice with driver, thin irons"
              required
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="currentGoal"
              className="block text-sm font-medium text-stone-700 mb-1"
            >
              Current goal
            </label>
            <input
              id="currentGoal"
              type="text"
              value={currentGoal}
              onChange={(e) => setCurrentGoal(e.target.value)}
              placeholder="e.g. break 90, improve short game"
              required
              className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700 text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-green-800 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2"
          >
            Start session
          </button>
        </form>
      </div>
    </div>
  );
}
