import type { Metadata } from "next";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import ConvexClientProvider from "@/app/components/ConvexClientProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Open Meme",
  description: "The Open Source Meme Game",
  icons: {
    icon: "/sticker.svg",
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
        <body className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-400 to-red-400 font-sans">
          <ConvexClientProvider>
            <main className="min-h-screen p-2 md:p-4">
              {children}
            </main>
            <Toaster 
              position="top-center"
              toastOptions={{
                style: {
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                },
              }}
            />
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
