import { useState, useEffect } from "react";
import { PipelineResult } from "@/lib/api";

interface Props {
  result: PipelineResult;
}

type TabType = "plan" | "code" | "tests" | "review";

export default function ResultPanel({ result }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("plan");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (result.plan && result.plan.length > 0) {
      setActiveTab("plan");
    } else if (result.code) {
      setActiveTab("code");
    } else if (result.tests) {
      setActiveTab("tests");
    } else if (result.review) {
      setActiveTab("review");
    }
  }, [result]);

  const handleCopy = async (text: string | null) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const currentCode = activeTab === "code" ? result.code : result.tests;
  const currentFileName = activeTab === "code" ? "main.py" : "test_main.py";

  return (
    <div className="shadcn-card overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-sm">Job Results</h2>
          <span className="shadcn-badge">{result.job_id.substring(0, 8)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[hsl(var(--border))] px-4 bg-[hsl(var(--background))]">
        {result.plan && (
          <button
            onClick={() => setActiveTab("plan")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "plan" ? "border-[hsl(var(--primary))] text-[hsl(var(--foreground))]" : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}
          >
            Strategy
          </button>
        )}
        {result.code && (
          <button
            onClick={() => setActiveTab("code")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "code" ? "border-[hsl(var(--primary))] text-[hsl(var(--foreground))]" : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}
          >
            Code
          </button>
        )}
        {result.tests && (
          <button
            onClick={() => setActiveTab("tests")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "tests" ? "border-[hsl(var(--primary))] text-[hsl(var(--foreground))]" : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}
          >
            Tests
          </button>
        )}
        {result.review && (
          <button
            onClick={() => setActiveTab("review")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "review" ? "border-[hsl(var(--primary))] text-[hsl(var(--foreground))]" : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}
          >
            Review
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="bg-[hsl(var(--background))]">
        {activeTab === "plan" && result.plan && (
          <div className="p-6 space-y-4">
            {result.plan.map((step, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-xs font-medium border border-[hsl(var(--border))]">
                  {i + 1}
                </div>
                <p className="text-sm pt-0.5 leading-relaxed text-[hsl(var(--foreground))]">
                  {step}
                </p>
              </div>
            ))}
          </div>
        )}

        {(activeTab === "code" || activeTab === "tests") && currentCode && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
              <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">{currentFileName}</span>
              <button 
                onClick={() => handleCopy(currentCode)}
                className="shadcn-btn-outline h-7 text-xs px-2"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto bg-[#0d1117] text-[#e6edf3] text-sm font-mono m-0 leading-relaxed max-h-[500px]">
              <code>{currentCode}</code>
            </pre>
          </div>
        )}

        {activeTab === "review" && result.review && (
          <div className="p-6">
            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[hsl(var(--foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="font-semibold text-sm">Security Audit</h3>
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed whitespace-pre-wrap">
                {result.review}
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
