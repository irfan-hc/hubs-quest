import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recursive Soundscapes | Meditative Procedural Music",
  description:
    "An interactive canvas transforming recursive mathematical processes into relaxing, harmonious ambient soundscapes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080B12] text-slate-200 antialiased selection:bg-purple-900/60 selection:text-purple-100 flex flex-col min-h-screen">
        {/* Subtle background ambient gradients */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-[30%] -left-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-indigo-950/30 to-purple-900/15 blur-[120px]" />
          <div className="absolute top-[40%] -right-[15%] h-[700px] w-[700px] rounded-full bg-gradient-to-bl from-violet-950/20 to-blue-950/20 blur-[140px]" />
          <div className="absolute -bottom-[20%] left-[25%] h-[500px] w-[500px] rounded-full bg-gradient-to-t from-slate-900/40 to-cyan-950/10 blur-[130px]" />
        </div>
        {children}
      </body>
    </html>
  );
}
