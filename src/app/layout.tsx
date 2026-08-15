import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider, ThemeScript } from "@/components/ThemeProvider";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interview Prep Platform",
  description:
    "Prepare smarter for technical interviews with coding practice, AI mock interviews, behavioral preparation, and progress tracking.",
  keywords: [
    "interview preparation",
    "coding practice",
    "mock interviews",
    "behavioral interviews",
    "technical interviews",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen antialiased">
        <SessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
