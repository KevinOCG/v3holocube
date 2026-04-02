"use client";

import "./globals.css";
import { Pridi, Inter } from 'next/font/google';
import { TeamProvider } from "../contexts/team-context";

// Oscine is a custom Moonbirds font - using Inter Black as a fallback
// To use the actual Oscine font, add the font files to public/fonts/
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-oscine',
  display: 'swap',
});

const pridi = Pridi({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-pridi',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${pridi.variable}`}>
      <body className="antialiased">
        <TeamProvider>{children}</TeamProvider>
      </body>
    </html>
  );
}
