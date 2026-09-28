import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "VETO — Anonymous Ethical Arena",
  description:
    "A live, completely anonymous arena for adversarial ethical reasoning. Crowd-weighted scoring: the smaller the chamber, the denser every vote.",
  applicationName: "Veto",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-void text-ink antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 void-grid opacity-60" aria-hidden />
        <div
          className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] vignette"
          aria-hidden
        />
        <SiteHeader />
        <main className="mx-auto w-full max-w-[1180px] px-5 pb-28 sm:px-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
