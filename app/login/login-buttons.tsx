"use client";

import { signIn } from "next-auth/react";

export default function LoginButtons() {
  return <div className="mt-8 flex flex-wrap gap-3"><button onClick={() => signIn("google", { callbackUrl: "/" })} className="diorama-pill">CONTINUE WITH GOOGLE</button><button onClick={() => signIn("github", { callbackUrl: "/" })} className="diorama-pill">CONTINUE WITH GITHUB</button></div>;
}
