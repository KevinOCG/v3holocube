import "./globals.css";
import { Pridi, Inter } from "next/font/google";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const pridi = Pridi({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700'],
  variable: '--font-pridi',
  display: 'swap',
});

export const metadata = {
  title: "Birb Prism Playtest",
  description: "Premium Birb prism concept",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${pridi.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
