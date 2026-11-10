import Link from "next/link";
import LoginButtons from "./login-buttons";

export default function LoginPage() {
  const configured = Boolean(process.env.AUTH_GITHUB_ID || process.env.AUTH_GOOGLE_ID);
  return <main className="diorama-page min-h-screen bg-[#141631] p-6 sm:p-12"><div className="diorama-sky fixed inset-0" /><div className="relative z-10"><p className="diorama-kicker">05 / OBSERVER LOGIN</p><h1 className="diorama-title mt-5 max-w-xl">Watch the village wake up.</h1><p className="diorama-subtitle mt-5 max-w-xl">Login is optional. Observers never see a wallet popup. {configured ? "Social login is configured." : "Social login is not configured in this environment, so guest watch mode is ready."}</p><LoginButtons showGithub={Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET)} showGoogle={Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)} /><Link href="/" className="mt-8 inline-block text-[10px] tracking-widest text-[#F6B93B]">ENTER GUEST WATCH MODE</Link></div></main>;
}
