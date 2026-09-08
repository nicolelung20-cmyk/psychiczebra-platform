import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elevated AI | Strategic clarity for ambitious teams",
  description: "An executive AI workspace for faster decisions, sharper strategy, and measurable growth.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
