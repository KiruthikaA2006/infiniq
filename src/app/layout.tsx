import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Synapse — AI Technical Interview Platform",
  description: "Adaptive AI technical interviewer that understands how developers think.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased font-sans bg-synapse-bg text-synapse-text-primary`}
    >
      <body className="min-h-full flex flex-col bg-synapse-bg text-synapse-text-primary">
        {children}
      </body>
    </html>
  );
}
