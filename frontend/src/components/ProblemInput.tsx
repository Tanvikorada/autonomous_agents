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
    <div className="panel p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-white">System Definition</label>
          <p className="text-sm text-[#888]">
            Describe the architecture, capabilities, and constraints of the system.
          </p>
        </div>
        
        <textarea
          value={problem}
          onChange={e => setProblem(e.target.value)}
          disabled={isLoading}
          placeholder="e.g. Build an autonomous trading bot in Python..."
          rows={5}
          className="w-full bg-[#0a0a0a] border border-[#222] rounded-md p-4 text-[15px] text-[#ededed] placeholder:text-[#555] focus:outline-none focus:border-[#444] transition-colors resize-none leading-relaxed"
        />
        
        <div className="flex justify-between items-center">
          <span className="text-[12px] font-mono text-[#555]">
            {problem.length < 10 ? `Min. 10 chars (${problem.length}/10)` : "Ready to deploy."}
          </span>
          
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary min-w-[140px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deploying
              </span>
            ) : (
              "Deploy Swarm"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
