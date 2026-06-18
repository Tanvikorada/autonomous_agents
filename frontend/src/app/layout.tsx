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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
