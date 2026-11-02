import Link from "next/link";

export default function RecordPage() {
  return (
    <main className="min-h-screen p-6 sm:p-10">
      <p className="dot-text text-[10px] text-[var(--blue)]">[ RECORD / MARKETDAY ]</p>
      <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-[-0.08em] sm:text-6xl">The village, recorded.</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
        A quiet capture room for the demo. Recording controls will connect to the village event stream in a later stage.
      </p>
      <Link href="/" className="mt-8 inline-block border border-[var(--ink)]/30 bg-[var(--paper)] px-4 py-3 text-[10px] tracking-widest hover:bg-white">
        ← BACK TO VILLAGE
      </Link>
    </main>
  );
}
