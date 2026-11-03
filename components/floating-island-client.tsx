"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const FloatingIslandDiorama = dynamic(() => import("./floating-island"), { ssr: false });

export default function FloatingIslandClient() {
  const pathname = usePathname();
  return <FloatingIslandDiorama recordMode={pathname === "/record"} />;
}
