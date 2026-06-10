import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeuraCanvas AI - Create Anything You Can Imagine",
  description: "Premium AI image generation platform. Transform your ideas into stunning visuals with state-of-the-art AI models. Create photorealistic images, anime art, cinematic scenes, and more.",
  keywords: ["AI", "image generation", "art", "creative", "NeuraCanvas", "artificial intelligence", "text to image"],
  authors: [{ name: "NeuraCanvas AI" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "NeuraCanvas AI - Create Anything You Can Imagine",
    description: "Premium AI image generation platform with state-of-the-art models",
    siteName: "NeuraCanvas AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
