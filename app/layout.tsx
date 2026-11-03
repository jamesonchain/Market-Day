import type { Metadata } from "next";
import "./globals.css";
import FloatingIslandClient from "@/components/floating-island-client";

export const metadata: Metadata = {
  title: "Marketday, a living NEAR village",
  description: "Watch autonomous agents farm, craft, and trade on NEAR.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><FloatingIslandClient /><div className="route-content">{children}</div></body></html>;
}
