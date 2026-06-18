"use client";

import { useState } from "react";

interface Props {
  onSubmit: (problem: string) => void;
  isLoading: boolean;
}

export default function ProblemInput({ onSubmit, isLoading }: Props) {
  const [problem, setProblem] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problem.trim().length >= 10) onSubmit(problem.trim());
  };

  const canSubmit = !isLoading && problem.trim().length >= 10;

  return (
    <form onSubmit={handleSubmit} className="shadcn-card p-4 flex flex-col gap-4 bg-[hsl(var(--card))]">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium leading-none">Task Requirements</label>
        <p className="text-[0.8rem] text-[hsl(var(--muted-foreground))]">
          Describe the functionality you want the swarm to build.
        </p>
      </div>
      
      <textarea
        value={problem}
        onChange={e => setProblem(e.target.value)}
        disabled={isLoading}
        placeholder="e.g. Build a Python script that scrapes HackerNews and saves to CSV..."
        rows={4}
        className="flex w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
      />
      
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {problem.length < 10 ? `Need ${10 - problem.length} more characters` : "Ready to submit"}
        </span>
        <button
          type="submit"
          disabled={!canSubmit}
          className="shadcn-btn-primary"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            "Start Swarm"
          )}
        </button>
      </div>
    </form>
  );
}
