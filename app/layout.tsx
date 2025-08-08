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
        <body className="min-h-screen bg-background text-foreground font-sans antialiased">
          {/* Ambient blurred gradients background */}
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            {/* Color blobs */}
            <div className="absolute -top-24 -left-24 h-[50vh] w-[60vw] rounded-full bg-[radial-gradient(circle_at_30%_30%,theme(colors.primary/55),transparent_60%)] blur-3xl opacity-80" />
            <div className="absolute -top-16 right-0 h-[40vh] w-[45vw] rounded-full bg-[radial-gradient(circle_at_70%_30%,theme(colors.accent/50),transparent_60%)] blur-3xl opacity-70" />
            <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 h-[55vh] w-[80vw] rounded-[40%] bg-[radial-gradient(60%_60%_at_50%_50%,oklch(0.6_0.12_260/_0.25),transparent_70%)] blur-3xl opacity-60" />
            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_10%,transparent,oklch(0_0_0/_0.35))]" />
          </div>
          <ConvexClientProvider>
            <main className="min-h-screen p-3 md:p-6">
              {children}
            </main>
            <Toaster position="top-center" theme="dark" richColors />
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
