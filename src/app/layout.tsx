import type { Metadata } from "next";
import { Syne, DM_Mono } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "./providers";
import Navbar from "@/components/Navbar";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  weight: ["300", "400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EgoArena",
  description: "Your personality is a character. Your character has a record. And the internet decides if you'd survive.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </PostHogProvider>
      </body>
    </html>
  );
}
