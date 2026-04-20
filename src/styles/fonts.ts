import { Manrope } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const geistSans = GeistSans;
export const geistMono = GeistMono;

/** Combined className for <html> — applies all three font variables. */
export const fontVariables = `${manrope.variable} ${GeistSans.variable} ${GeistMono.variable}`;
