import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { NavBar } from "@/components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "GradifyAI",
  description: "College admission prediction and cutoff intelligence platform."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <NavBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
