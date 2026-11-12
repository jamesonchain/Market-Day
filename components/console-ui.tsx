import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) { return <button className={`ui-button ${className}`} {...props}>{children}</button>; }
export function Tab({ active, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; children: ReactNode }) { return <button className={`ui-tab${active ? " active" : ""}`} {...props}>{children}</button>; }
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`ui-card ${className}`}>{children}</section>; }
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) { return <aside className={`ui-panel ${className}`}>{children}</aside>; }
export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "bad" | "accent" }) { return <span className={`ui-tag ${tone}`}>{children}</span>; }
export function Toast({ children }: { children: ReactNode }) { return <div className="ui-toast" role="status">{children}</div>; }
