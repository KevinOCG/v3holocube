import "./globals.css";

export const metadata = {
  title: "Birb Prism Playtest",
  description: "Premium Birb prism concept",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
