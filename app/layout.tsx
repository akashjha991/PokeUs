import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "@/frontend/components/providers";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PokeUs — Your Private Space for Two",
    template: "%s | PokeUs",
  },
  description:
    "PokeUs is the premium couple-connect platform for sharing memories, chatting in real-time, tracking moods, and building your love story together.",
  keywords: ["couple app", "relationship app", "private space", "chat", "memories", "pokeus"],
  authors: [{ name: "PokeUs" }],
  creator: "PokeUs",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pokeus.app",
    title: "PokeUs — Your Private Space for Two",
    description: "A premium couple platform to share your world privately.",
    siteName: "PokeUs",
  },
  twitter: {
    card: "summary_large_image",
    title: "PokeUs — Your Private Space for Two",
    description: "A premium couple platform to share your world privately.",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08061a" },
    { media: "(prefers-color-scheme: light)", color: "#fdf4ff" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#a855f7",
          colorBackground: "#08061a",
          colorInputBackground: "#13102b",
          colorText: "#f0e6ff",
          colorTextSecondary: "#a78bda",
          borderRadius: "0.75rem",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${outfit.variable} antialiased`}>
          <Providers>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "rgb(var(--surface))",
                  border: "1px solid rgb(var(--border))",
                  color: "rgb(var(--text))",
                },
              }}
              richColors
            />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
