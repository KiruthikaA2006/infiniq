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
  title: "InfiniQ — AI Technical Interviewer",
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased font-sans bg-infiniq-bg text-infiniq-text-primary`}
    >
      <body className="min-h-full flex flex-col bg-infiniq-bg text-infiniq-text-primary">
        {children}
      </body>
    </html>
  );
}
