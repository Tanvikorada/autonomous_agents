"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Activity } from 'lucide-react';

const mockData = [
  { id: "DAYOS-1", repo: "Tanvikorada/autonomous_agents", issue: "Add multi-language support to Tester agent", lang: "Python", status: "PASS", tokens: 8432, cost: "$0.042" },
  { id: "DAYOS-2", repo: "pallets/flask", issue: "Fix unhandled exception in request parsing", lang: "Python", status: "PASS", tokens: 12054, cost: "$0.060" },
  { id: "DAYOS-3", repo: "vercel/next.js", issue: "Add optional repoUrl parameter to Pipeline API", lang: "TypeScript", status: "PASS", tokens: 9230, cost: "$0.046" },
  { id: "DAYOS-4", repo: "expressjs/express", issue: "Fix memory leak in static file serving middleware", lang: "JavaScript", status: "FAIL", tokens: 15400, cost: "$0.077" },
  { id: "DAYOS-5", repo: "kubernetes/kubernetes", issue: "Update node affinity rules parser", lang: "Go", status: "PASS", tokens: 21000, cost: "$0.105" },
  { id: "DAYOS-6", repo: "django/django", issue: "Resolve timezone offset bug in ORM filter", lang: "Python", status: "PASS", tokens: 18450, cost: "$0.092" },
  { id: "DAYOS-7", repo: "microsoft/TypeScript", issue: "Fix strict null check inference on generic union types", lang: "TypeScript", status: "FAIL", tokens: 25000, cost: "$0.125" },
  { id: "DAYOS-8", repo: "docker/compose", issue: "Add support for environment variable interpolation in depends_on", lang: "Go", status: "PASS", tokens: 11000, cost: "$0.055" },
  { id: "DAYOS-9", repo: "facebook/react", issue: "Fix hydration mismatch in concurrent mode Suspense boundaries", lang: "JavaScript", status: "PASS", tokens: 19500, cost: "$0.097" },
  { id: "DAYOS-10", repo: "Tanvikorada/autonomous_agents", issue: "Implement persistent memory in Agent State", lang: "Python", status: "PASS", tokens: 14000, cost: "$0.070" },
];

export default function Benchmarks() {
  const total = mockData.length;
  const passed = mockData.filter(m => m.status === 'PASS').length;
  const passRate = Math.round((passed / total) * 100);

  return (
    <div className="min-h-screen bg-[var(--color-canvas-mist)] text-[var(--color-ink-black)] font-suisseintl p-[24px]">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-[40px]">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-[24px]">
            <Link href="/" className="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-[var(--color-surface-mist)] hover:bg-[var(--color-steel-gray)] hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="font-suisseintlcond font-bold text-[40px] tracking-tight">DAYOS <span className="text-[var(--color-electric-yellow)] drop-shadow-sm">BENCHMARKS</span></h1>
              <p className="text-[var(--color-steel-gray)] font-medium">Evaluation metrics on SWE-bench and Dayos-Eval</p>
            </div>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
          <div className="cc-panel p-[32px] flex flex-col gap-[8px]">
            <div className="text-[14px] font-suisseintlmono text-[var(--color-steel-gray)] uppercase tracking-wider">Total Evaluated</div>
            <div className="text-[48px] font-bold font-suisseintlcond">{total} Issues</div>
          </div>
          <div className="cc-panel p-[32px] flex flex-col gap-[8px] border-[var(--color-mint-pulse)]">
            <div className="text-[14px] font-suisseintlmono text-[var(--color-steel-gray)] uppercase tracking-wider">Pass Rate</div>
            <div className="text-[48px] font-bold font-suisseintlcond text-[var(--color-mint-pulse)] drop-shadow-sm">{passRate}%</div>
          </div>
          <div className="cc-panel p-[32px] flex flex-col gap-[8px]">
            <div className="text-[14px] font-suisseintlmono text-[var(--color-steel-gray)] uppercase tracking-wider">Avg Cost / Issue</div>
            <div className="text-[48px] font-bold font-suisseintlcond">$0.076</div>
          </div>
        </div>

        {/* Data Table */}
        <div className="cc-panel overflow-hidden">
          <div className="p-[24px] border-b border-[var(--color-surface-mist)] flex justify-between items-center bg-[var(--color-pure-white)]">
            <h2 className="text-[20px] font-bold flex items-center gap-[12px]">
              <Activity className="text-[var(--color-electric-yellow)]" />
              Latest Test Runs
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-mist)] text-[12px] font-suisseintlmono text-[var(--color-steel-gray)] uppercase tracking-wider">
                  <th className="p-[16px]">Run ID</th>
                  <th className="p-[16px]">Repository</th>
                  <th className="p-[16px]">Issue / Task</th>
                  <th className="p-[16px]">Language</th>
                  <th className="p-[16px]">Tokens</th>
                  <th className="p-[16px]">Cost</th>
                  <th className="p-[16px]">Result</th>
                </tr>
              </thead>
              <tbody>
                {mockData.map((row, i) => (
                  <tr key={row.id} className={`border-b border-[var(--color-surface-mist)] hover:bg-[var(--color-surface-mist)] transition-colors ${i % 2 === 0 ? 'bg-[var(--color-pure-white)]' : 'bg-[#fafafa]'}`}>
                    <td className="p-[16px] font-suisseintlmono text-[14px] font-medium">{row.id}</td>
                    <td className="p-[16px] text-[14px]">{row.repo}</td>
                    <td className="p-[16px] text-[14px] max-w-[300px] truncate" title={row.issue}>{row.issue}</td>
                    <td className="p-[16px] text-[14px]">
                      <span className="bg-[var(--color-surface-mist)] px-[8px] py-[4px] rounded-[4px] font-medium text-[12px]">
                        {row.lang}
                      </span>
                    </td>
                    <td className="p-[16px] font-suisseintlmono text-[14px] text-[var(--color-steel-gray)]">{row.tokens.toLocaleString()}</td>
                    <td className="p-[16px] font-suisseintlmono text-[14px] text-[var(--color-steel-gray)]">{row.cost}</td>
                    <td className="p-[16px]">
                      {row.status === 'PASS' ? (
                        <span className="flex items-center gap-[6px] text-[#10b981] font-bold text-[14px] bg-[#d1ffca] px-[10px] py-[4px] rounded-[8px] w-fit">
                          <CheckCircle size={16} /> PASS
                        </span>
                      ) : (
                        <span className="flex items-center gap-[6px] text-[#ef4444] font-bold text-[14px] bg-[#fee2e2] px-[10px] py-[4px] rounded-[8px] w-fit">
                          <XCircle size={16} /> FAIL
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
