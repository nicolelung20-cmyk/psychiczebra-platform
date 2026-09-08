import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elevated AI | Executive AI Implementation",
  description:
    "AI implementation engagements for executive teams ready to move from strategy to responsible action.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
