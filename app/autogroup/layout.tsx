import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AUTOGROUP 247",
  manifest: "/autogroup.webmanifest",
  icons: { icon: "/autogroup-192.png", apple: "/autogroup-apple-touch.png" },
  appleWebApp: { capable: true, title: "AUTOGROUP", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#0b0d0c", width: "device-width", initialScale: 1 };

export default function AutogroupLayout({ children }: { children: ReactNode }) {
  return children;
}
