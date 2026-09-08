import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PsychicZebra | AI that moves work forward",
  description: "A focused AI workspace powered by OpenRouter.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
