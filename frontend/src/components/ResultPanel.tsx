import { PipelineResult } from "@/lib/api";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  result: PipelineResult | null;
  isLoading: boolean;
  currentAgent?: string | null;
  status?: string;
  onApprove?: (plan: string[]) => void;
}

export default function ResultPanel({ result, isLoading, currentAgent, status, onApprove }: Props) {
  const [activeTab, setActiveTab] = useState<"plan" | "code" | "tests" | "review">("plan");

  const tabs = [
    { id: "plan", label: "01_PLAN.md", content: result?.plan },
    { id: "code", label: "02_CODE.py", content: result?.code },
    { id: "tests", label: "03_TESTS.py", content: result?.tests },
    { id: "review", label: "04_AUDIT.log", content: result?.review },
  ] as const;

  type TabId = "plan" | "code" | "tests" | "review";

  // Determine which tab to show by default if no result yet
  useEffect(() => {
    if (!result && currentAgent) {
      if (currentAgent === "planner") setActiveTab("plan");
      else if (currentAgent === "coder") setActiveTab("code");
      else if (currentAgent === "tester") setActiveTab("tests");
      else if (currentAgent === "reviewer") setActiveTab("review");
    }
  }, [currentAgent, result]);

  return (
    <div className="h-full flex flex-col cc-panel">
      {/* Tabs Header */}
      <div className="flex items-center gap-[24px] px-[32px] pt-[32px] pb-[16px] border-b border-[var(--color-surface-mist)] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className="relative pb-2 font-suisseintl font-medium text-[16px] tracking-tight transition-colors whitespace-nowrap"
          >
            <span className={activeTab === tab.id ? "text-[var(--color-ink-black)] relative z-10" : "text-[var(--color-steel-gray)] hover:text-[var(--color-ink-black)]"}>
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-[2px] left-[-4px] right-[-4px] h-[12px] bg-[var(--color-mint-pulse)] -z-10 rounded-[2px]"></span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-[32px] relative bg-[var(--color-pure-white)] text-[var(--color-ink-black)]">
        {isLoading && !result && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-pure-white)]/80 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="w-[40px] h-[40px] border-[3px] border-[var(--color-surface-mist)] border-t-[var(--color-ink-black)] rounded-full animate-spin"></div>
              <p className="text-[14px] font-suisseintlmono text-[var(--color-steel-gray)] uppercase tracking-wide">Generating {activeTab}...</p>
            </div>
          </div>
        )}

        {/* Dynamic Content */}
        <div className="h-full prose prose-sm max-w-none">
          {activeTab === "code" && (
            result?.code ? (
              <pre className="font-suisseintlmono text-[14px] bg-[var(--color-surface-mist)] p-[24px] rounded-[16px] overflow-x-auto text-[var(--color-ink-black)]">
                <code>{result.code}</code>
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--color-steel-gray)] font-suisseintlmono text-[12px] uppercase">
                [ No code output yet ]
              </div>
            )
          )}
          {activeTab === "plan" && (
            <div className="font-suisseintl text-[16px] leading-[1.33] text-[var(--color-ink-black)] flex flex-col h-full">
              {result?.plan ? (
                <div className="flex-1">
                  <div className="whitespace-pre-wrap">{Array.isArray(result.plan) ? result.plan.join("\n") : result.plan}</div>
                  {status === "awaiting_approval" && onApprove && (
                    <div className="mt-8 pt-4 border-t border-[var(--color-surface-mist)] flex justify-end">
                      <button 
                        onClick={() => onApprove(result.plan || [])}
                        className="cc-btn-primary"
                      >
                        Approve Plan & Continue
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-[var(--color-steel-gray)] font-suisseintlmono text-[12px] uppercase min-h-[200px]">
                  [ No plan output yet ]
                </div>
              )}
            </div>
          )}
          {activeTab === "tests" && (
            <div className="font-suisseintlmono text-[14px] leading-relaxed text-[var(--color-ink-black)] bg-[var(--color-surface-mist)] p-[24px] rounded-[16px]">
              {result?.tests ? <div className="whitespace-pre-wrap">{result.tests}</div> : (
                <div className="h-full flex items-center justify-center text-[var(--color-steel-gray)] font-suisseintlmono text-[12px] uppercase min-h-[200px]">
                  [ No tests output yet ]
                </div>
              )}
            </div>
          )}
          {activeTab === "review" && (
            <div className="font-suisseintl text-[16px] leading-[1.33] text-[var(--color-ink-black)]">
              {result?.review ? <div className="whitespace-pre-wrap">{result.review}</div> : (
                <div className="h-full flex items-center justify-center text-[var(--color-steel-gray)] font-suisseintlmono text-[12px] uppercase min-h-[200px]">
                  [ No review output yet ]
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Metrics Footer */}
        {result && (result.total_tokens !== undefined || result.review_risk_score !== undefined) && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-[var(--color-surface-mist)] border-t border-[var(--color-mist)] flex items-center justify-between text-[12px] font-suisseintlmono text-[var(--color-graphite)] uppercase">
            <div className="flex gap-6">
              {result.total_tokens !== undefined && (
                <span>Tokens: {result.total_tokens.toLocaleString()} | Cost: ${result.total_cost?.toFixed(5)}</span>
              )}
              {result.retries !== undefined && result.retries > 0 && (
                <span className="text-red-500">Retries: {result.retries}</span>
              )}
            </div>
            {result.review_risk_score !== undefined && (
              <div className="flex gap-4">
                <span>Risk Score: {result.review_risk_score}/10</span>
                <span>Confidence: {result.review_confidence}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
