import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Autonomous Multi-Agent System | AI Software Engineering",
  description:
    "An AI system powered by 4 specialized agents (Planner, Coder, Tester, Reviewer) that automatically writes, tests, and reviews code from a problem statement.",
  keywords: ["AI agents", "code generation", "autonomous coding", "LangGraph", "FastAPI"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
