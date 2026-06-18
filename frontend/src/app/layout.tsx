import type { Metadata } from "next";
import { Inter, Barlow_Condensed, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-suisseintl",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-suisseintlcond",
  weight: ["700"],
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-suisseintlmono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dayos OS",
  description: "Autonomous Multi-Agent Software Engineering System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${barlowCondensed.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
