import Link from "next/link";
import LoginButtons from "./login-buttons";

export default function LoginPage() {
  const configured = Boolean(process.env.AUTH_GITHUB_ID || process.env.AUTH_GOOGLE_ID);
  return <main className="min-h-screen p-6 sm:p-10"><p className="dot-text text-[10px] text-[var(--blue)]">[ 05 / OBSERVER LOGIN ]</p><h1 className="mt-4 max-w-xl text-4xl font-bold tracking-[-0.08em] sm:text-6xl">Watch the village wake up.</h1><p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)]">Login is optional. Observers never see a wallet popup. {configured ? "Social login is configured." : "Social login is not configured in this environment, so guest watch mode is ready."}</p><LoginButtons /><Link href="/" className="mt-8 inline-block text-[10px] tracking-widest text-[var(--blue)]">ENTER GUEST WATCH MODE →</Link></main>;
}
