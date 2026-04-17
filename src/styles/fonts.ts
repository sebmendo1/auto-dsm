import { Manrope, Sora } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';

export const manrope = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

export const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sora',
  display: 'swap',
});

export const geistMono = GeistMono;
