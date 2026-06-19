import { PipelineResult } from "@/lib/api";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CheckCircle2, AlertTriangle, Lightbulb, ShieldAlert, BadgeCheck } from "lucide-react";
interface Props {
  result: PipelineResult | null;
  isLoading: boolean;
  currentAgent?: string | null;
  status?: string;
  onApprove?: (plan: string[]) => void;
}

export default function ResultPanel({ result, isLoading, currentAgent, status, onApprove }: Props) {
  const [activeTab, setActiveTab] = useState<"plan" | "code" | "tests" | "review" | "rag">("plan");

  const tabs = [
    { id: "plan", label: "01_PLAN.md", content: result?.plan },
    { id: "rag", label: "05_RAG.log", content: result?.retrieved_context },
    { id: "code", label: "02_CODE.py", content: result?.code },
    { id: "tests", label: "03_TESTS.py", content: result?.tests },
    { id: "review", label: "04_AUDIT.log", content: result?.review },
  ] as const;

  type TabId = "plan" | "code" | "tests" | "review" | "rag";

  // Determine which tab to show by default if no result yet
  useEffect(() => {
    if (!result && currentAgent) {
      setTimeout(() => {
        if (currentAgent === "planner") setActiveTab("plan");
        else if (currentAgent === "coder") setActiveTab("code");
        else if (currentAgent === "tester") setActiveTab("tests");
        else if (currentAgent === "reviewer") setActiveTab("review");
      }, 0);
    }
  }, [currentAgent, result]);

  // Helper to safely parse review JSON
  const parseReview = (reviewText?: string) => {
    if (!reviewText) return null;
    try {
      // Find the first { and last } to extract pure JSON, bypassing any conversational text or markdown blocks
      const firstBrace = reviewText.indexOf('{');
      const lastBrace = reviewText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonStr = reviewText.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonStr);
      }
      return JSON.parse(reviewText);
    } catch {
      return null;
    }
  };

  const reviewData = parseReview(result?.review);

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
              <div className="rounded-[16px] overflow-hidden border border-[var(--color-surface-mist)] shadow-sm">
                <SyntaxHighlighter
                  language="python"
                  style={oneLight}
                  customStyle={{ margin: 0, padding: "24px", fontSize: "14px", fontFamily: "var(--font-suisse-intl-mono)" }}
                  showLineNumbers
                >
                  {result.code}
                </SyntaxHighlighter>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--color-steel-gray)] font-suisseintlmono text-[12px] uppercase">
                [ No code output yet ]
              </div>
            )
          )}
          
          {activeTab === "plan" && (
            <div className="font-suisseintl text-[16px] leading-[1.6] text-[var(--color-ink-black)] flex flex-col h-full">
              {result?.plan ? (
                <div className="flex-1">
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {Array.isArray(result.plan) ? result.plan.join("\n") : result.plan}
                    </ReactMarkdown>
                  </div>
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
            <div className="flex flex-col h-full gap-4">
              {/* Sandbox Status Indicator */}
              {((currentAgent === "tester" && !result?.tests) || result?.tests) && (
                <div className="bg-[var(--color-surface-mist)] border border-[var(--color-mist)] rounded-[12px] p-[16px] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-3 w-3">
                      {currentAgent === "tester" ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </>
                      ) : (
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${result?.test_passed ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      )}
                    </div>
                    <div className="font-suisseintlmono text-[13px] tracking-wide uppercase text-[var(--color-ink-black)]">
                      {currentAgent === "tester" ? "Docker Sandbox Spinning Up..." : "Docker Sandbox Execution Complete"}
                    </div>
                  </div>
                  <div className="flex gap-4 font-suisseintlmono text-[11px] uppercase text-[var(--color-steel-gray)]">
                    <span className="bg-white px-2 py-1 rounded-[4px] border border-[var(--color-mist)]">RAM: 512MB</span>
                    <span className="bg-white px-2 py-1 rounded-[4px] border border-[var(--color-mist)]">CPU: 0.5</span>
                    <span className="bg-white px-2 py-1 rounded-[4px] border border-[var(--color-mist)]">Network: NONE</span>
                  </div>
                </div>
              )}


          {activeTab === "rag" && (
            <div className="flex flex-col h-full gap-4">
              {result?.retrieved_context && result.retrieved_context.length > 0 ? (
                <div className="flex flex-col gap-[16px] h-full overflow-y-auto pr-2 pb-[100px]">
                  {result.retrieved_context.map((chunk, idx) => (
                    <div key={idx} className="border border-[var(--color-surface-mist)] rounded-[12px] overflow-hidden">
                      <div className="bg-[var(--color-surface-mist)] px-[16px] py-[8px] border-b border-[var(--color-mist)] flex items-center justify-between">
                        <span className="font-suisseintlmono text-[12px] text-[var(--color-ink-black)] font-medium">
                          {chunk.source}
                        </span>
                        <span className="font-suisseintlmono text-[10px] uppercase text-[var(--color-steel-gray)] bg-white px-[6px] py-[2px] rounded-[4px]">
                          Chunk {idx + 1}
                        </span>
                      </div>
                      <SyntaxHighlighter
                        language={chunk.source.endsWith('.ts') || chunk.source.endsWith('.tsx') ? 'typescript' : 'python'}
                        style={oneLight}
                        customStyle={{ margin: 0, padding: "16px", fontSize: "13px", fontFamily: "var(--font-suisse-intl-mono)" }}
                      >
                        {chunk.content}
                      </SyntaxHighlighter>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-[var(--color-steel-gray)] font-suisseintlmono text-[12px] uppercase min-h-[200px]">
                  [ No RAG context retrieved ]
                </div>
              )}
            </div>
          )}
          
          {activeTab === "review" && (
            <div className="font-suisseintl text-[16px] leading-[1.33] text-[var(--color-ink-black)]">
              {reviewData ? (
                <div className="grid grid-cols-2 gap-[24px]">
                  {/* Top Stats */}
                  <div className="col-span-2 flex gap-[24px]">
                    <div className="flex-1 bg-[var(--color-surface-mist)] p-[24px] rounded-[16px] flex items-center gap-[16px]">
                      <BadgeCheck className="w-8 h-8 text-[var(--color-ink-black)]" />
                      <div>
                        <div className="text-[12px] font-suisseintlmono text-[var(--color-steel-gray)] uppercase tracking-wide">Quality Score</div>
                        <div className="text-[24px] font-medium tracking-tight mt-1">{reviewData.quality_score || "N/A"}</div>
                      </div>
                    </div>
                    <div className={`flex-1 p-[24px] rounded-[16px] flex items-center gap-[16px] ${reviewData.risk_score > 5 ? 'bg-red-50 text-red-900' : 'bg-[var(--color-mint-pulse)] text-[var(--color-ink-black)]'}`}>
                      <ShieldAlert className="w-8 h-8" />
                      <div>
                        <div className="text-[12px] font-suisseintlmono uppercase tracking-wide opacity-70">Risk Assessment</div>
                        <div className="text-[24px] font-medium tracking-tight mt-1">{reviewData.risk_score || "0"}/10</div>
                        <div className="text-[14px] mt-1 opacity-90">{reviewData.confidence} Confidence</div>
                      </div>
                    </div>
                  </div>

                  {/* Strengths */}
                  <div className="col-span-1 border border-[var(--color-surface-mist)] p-[24px] rounded-[16px]">
                    <div className="flex items-center gap-[8px] mb-[16px] border-b border-[var(--color-surface-mist)] pb-[12px]">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <h3 className="font-medium text-[18px]">Strengths</h3>
                    </div>
                    <ul className="space-y-[12px]">
                      {reviewData.strengths?.map((s: string, i: number) => (
                        <li key={i} className="flex gap-[12px] text-[15px] leading-relaxed">
                          <span className="text-[var(--color-steel-gray)] mt-1">•</span>
                          <span className="markdown-body prose prose-sm max-w-none prose-p:my-0"><ReactMarkdown remarkPlugins={[remarkGfm]}>{s}</ReactMarkdown></span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Issues */}
                  <div className="col-span-1 border border-[var(--color-surface-mist)] p-[24px] rounded-[16px]">
                    <div className="flex items-center gap-[8px] mb-[16px] border-b border-[var(--color-surface-mist)] pb-[12px]">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <h3 className="font-medium text-[18px]">Issues Found</h3>
                    </div>
                    <ul className="space-y-[12px]">
                      {reviewData.issues_found?.map((issue: string, i: number) => (
                        <li key={i} className="flex gap-[12px] text-[15px] leading-relaxed">
                          <span className="text-[var(--color-steel-gray)] mt-1">•</span>
                          <span className="markdown-body prose prose-sm max-w-none prose-p:my-0"><ReactMarkdown remarkPlugins={[remarkGfm]}>{issue}</ReactMarkdown></span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Fixes */}
                  <div className="col-span-2 border border-[var(--color-surface-mist)] p-[24px] rounded-[16px]">
                    <div className="flex items-center gap-[8px] mb-[16px] border-b border-[var(--color-surface-mist)] pb-[12px]">
                      <Lightbulb className="w-5 h-5 text-blue-500" />
                      <h3 className="font-medium text-[18px]">Suggested Fixes</h3>
                    </div>
                    <ul className="space-y-[12px]">
                      {reviewData.suggested_fixes?.map((fix: string, i: number) => (
                        <li key={i} className="flex gap-[12px] text-[15px] leading-relaxed">
                          <span className="text-[var(--color-steel-gray)] font-suisseintlmono text-[12px] pt-1 mt-0.5">{i + 1}.</span>
                          <span className="markdown-body prose prose-sm max-w-none prose-p:my-0"><ReactMarkdown remarkPlugins={[remarkGfm]}>{fix}</ReactMarkdown></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : result?.review ? (
                <div className="whitespace-pre-wrap">{result.review}</div>
              ) : (
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
            <div className="flex gap-6 items-center">
              {result.agent_metrics && Object.keys(result.agent_metrics).length > 0 ? (
                <div className="flex gap-4">
                  {Object.entries(result.agent_metrics).map(([agent, metrics]) => (
                    <span key={agent} className="bg-white px-2 py-1 rounded-[4px] border border-[var(--color-mist)]" title={`Tokens: ${metrics.tokens}`}>
                      {agent}: ${metrics.cost.toFixed(5)}
                    </span>
                  ))}
                  <span className="font-bold text-[var(--color-ink-black)] ml-2" title={`Total Tokens: ${result.total_tokens}`}>
                    Total: ${result.total_cost?.toFixed(5)}
                  </span>
                </div>
              ) : result.total_tokens !== undefined && (
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
