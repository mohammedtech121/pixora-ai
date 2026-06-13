import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pixora.ai - Create Anything You Can Imagine",
  description: "Premium AI image generation platform. Transform your ideas into stunning visuals with state-of-the-art AI models. Create photorealistic images, anime art, cinematic scenes, and more.",
  keywords: ["AI", "image generation", "art", "creative", "Pixora", "artificial intelligence", "text to image"],
  authors: [{ name: "Pixora.ai" }],
  icons: {
    icon: [
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg?v=2",
  },
  openGraph: {
    title: "Pixora.ai - Create Anything You Can Imagine",
    description: "Premium AI image generation platform with state-of-the-art models",
    siteName: "Pixora.ai",
    type: "website",
    images: ["/favicon.svg?v=2"],
  },
  twitter: {
    card: "summary",
    images: ["/favicon.svg?v=2"],
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
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
