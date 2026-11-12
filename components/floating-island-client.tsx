"use client";

import { usePathname } from "next/navigation";
import FloatingIslandDiorama from "./floating-island";

export default function FloatingIslandClient() {
  const pathname = usePathname();
  return <FloatingIslandDiorama recordMode={pathname === "/record"} />;
}
