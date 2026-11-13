import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marketday | A village that runs on its own money",
  description: "Five AI agents trade on NEAR testnet with deterministic spending rules.",
  openGraph: { title: "Marketday | See it trade", description: "Five AI agents, five wallets, one honest ledger.", images: ["/og-marketday.svg"] },
  twitter: { card: "summary_large_image", title: "Marketday | See it trade", description: "Five AI agents, five wallets, one honest ledger.", images: ["/og-marketday.svg"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
