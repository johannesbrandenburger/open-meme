import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import ConvexClientProvider from "@/app/components/ConvexClientProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Open Meme",
  description: "The Open Source Meme Game",
  icons: {
    icon: "/convex.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <body className="min-h-screen bg-linear-to-br from-purple-400 via-pink-500 to-red-500">
          <ConvexClientProvider>
            {children}
            <Toaster 
            />
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
