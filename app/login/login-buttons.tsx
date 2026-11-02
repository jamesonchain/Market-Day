"use client";

import { signIn } from "next-auth/react";

export default function LoginButtons() {
  return <div className="mt-8 flex flex-wrap gap-3"><button onClick={() => signIn("google", { callbackUrl: "/" })} className="border border-[var(--ink)]/30 bg-[var(--paper)] px-4 py-3 text-[10px] tracking-widest hover:bg-white">CONTINUE WITH GOOGLE</button><button onClick={() => signIn("github", { callbackUrl: "/" })} className="border border-[var(--ink)]/30 bg-[var(--paper)] px-4 py-3 text-[10px] tracking-widest hover:bg-white">CONTINUE WITH GITHUB</button></div>;
}
