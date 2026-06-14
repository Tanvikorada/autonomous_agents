import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Autonomous Agents — Multi-Agent Software Engineering System",
  description:
    "Four specialized AI agents — Planner, Coder, Tester, Reviewer — that autonomously write, test, and review production code from a single problem statement.",
  keywords: ["AI agents", "code generation", "autonomous coding", "LangGraph", "FastAPI"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
