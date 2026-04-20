"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { normalizeRepoInput } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Landing page — PDF §5.
 * Light-mode only for V1. One CTA above the fold. No scroll sections.
 */
export default function LandingPage() {
  const router = useRouter();
  const [value, setValue] = React.useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const normalized = normalizeRepoInput(value);
    if (!normalized) {
      toast.error("Enter a GitHub repo as owner/repo or a github.com URL.");
      return;
    }
    try {
      sessionStorage.setItem("autodsm.pendingRepo", normalized);
    } catch {
      // ignore
    }
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-white text-[#111113] light">
      {/* Top bar */}
      <div className="flex items-center justify-between h-[72px] px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/autodsm-wordmark-light.svg"
            alt="autoDSM"
            width={132}
            height={24}
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1 bg-[#F4F4F6] rounded-full p-1 border border-[#EAEAEC]">
          {["Product", "Workflows", "Benefits"].map((label) => (
            <a
              key={label}
              href="#"
              className="px-4 h-9 inline-flex items-center rounded-full text-[13px] text-[#5C5C61] hover:text-[#111113] transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        <Link
          href="/login"
          className="inline-flex items-center h-10 px-5 rounded-full bg-[#8F23FA] hover:bg-[#7A1DD6] text-white text-[14px] font-medium transition-colors"
        >
          Log in
        </Link>
      </div>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-[15vh]">
        <h1
          className="max-w-[820px]"
          style={{
            fontFamily: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "44px",
            lineHeight: "52px",
            letterSpacing: "-0.02em",
            color: "#111113",
          }}
        >
          Visualize and maintain your design system with your GitHub repo
        </h1>

        <p
          className="mt-5 max-w-[620px]"
          style={{
            fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
            fontWeight: 400,
            fontSize: "17px",
            lineHeight: "26px",
            color: "#6B6B70",
          }}
        >
          The design system manager built for the AI era.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 flex items-center gap-1 h-14 w-full max-w-[520px] bg-white rounded-full border border-[#EAEAEC] pl-5 pr-1.5 shadow-[0_10px_30px_-12px_rgba(17,17,19,0.12)]"
        >
          <input
            type="text"
            placeholder="Your Github repo"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            spellCheck={false}
            className="flex-1 h-full bg-transparent outline-none text-[15px] text-[#111113] placeholder:text-[#B8B8BD]"
            style={{
              fontFamily:
                "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
            }}
          />
          <button
            type="submit"
            className="h-11 px-5 inline-flex items-center gap-1.5 rounded-full bg-[#8F23FA] hover:bg-[#7A1DD6] text-white text-[14px] font-medium transition-colors"
          >
            Get started
            <ArrowRight size={15} strokeWidth={1.8} />
          </button>
        </form>

        <p
          className="mt-6 text-[12px] text-[#9E9EA3]"
          style={{
            fontFamily:
              "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
          }}
        >
          Works with public repos. Private repo support via the autoDSM GitHub App.
        </p>
      </section>
    </div>
  );
}
