import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AUTONOMOUS_ | Multi-Agent Swarm OS",
  description:
    "Deploy a swarm of specialized autonomous agents to architect, synthesize, and audit your applications. Experience the next evolution of multi-agent software engineering.",
  keywords: ["AI agents", "code generation", "autonomous coding", "LangGraph", "FastAPI", "swarm"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=Geist:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
