"use client";

import { signIn } from "next-auth/react";

export default function LoginButtons({ showGithub, showGoogle }: { showGithub: boolean; showGoogle: boolean }) {
  return <div className="login-buttons">{showGithub && <button onClick={() => signIn("github", { callbackUrl: "/village" })}>CONTINUE WITH GITHUB</button>}{showGoogle && <button onClick={() => signIn("google", { callbackUrl: "/village" })}>CONTINUE WITH GOOGLE</button>}</div>;
}
