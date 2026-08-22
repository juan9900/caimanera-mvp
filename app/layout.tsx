import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Anybody, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// "High-Velocity" design system fonts: Anybody for headlines, Hanken Grotesk
// for body copy, JetBrains Mono for labels/data (times, distances, badges).
const anybody = Anybody({
  variable: "--font-anybody",
  subsets: ["latin"],
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const FAVICON_URL =
  "https://res.cloudinary.com/mdnclientes/image/upload/v1787421446/Kancha/Isotipo_Kancha_vjiyru.webp";

export const metadata: Metadata = {
  title: "Kancha",
  description: "Consigue jugadores para tu caimanera de fútbol en Maracaibo",
  manifest: "/manifest.json",
  icons: {
    icon: FAVICON_URL,
    apple: FAVICON_URL,
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${anybody.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pb-20">
        <SiteHeader />
        {children}
        <BottomNav />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
