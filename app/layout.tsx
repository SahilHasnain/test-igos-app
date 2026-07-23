import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "IGOS", description: "Information governance operating system for multi-academy trusts" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en-GB"><body>{children}</body></html>; }
