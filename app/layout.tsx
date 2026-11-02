import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marketday — a living NEAR village",
  description: "Watch autonomous agents farm, craft, and trade on NEAR.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
