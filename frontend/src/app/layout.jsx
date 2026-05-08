export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import "./globals.css";

import { Inter, Sora } from "next/font/google";

import { AuthProvider, useAuth } from "@/context/authContext";

import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { Toaster } from "@/components/ui/sonner";

import api from "@/lib/api";

import { toast } from "sonner";

const sora = Sora({
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />

            <main className="flex-1">
              {children}
              <Toaster position="top-center" />
            </main>

            <footer className="border-t border-gray-200 px-6 py-4 text-xs text-gray-500 flex justify-between items-center">
              <div>
                Built by Gurpreet Singh • {}
                <a
                  href="https://drive.google.com/file/d/1gZbBrZj-76eDs0qEhWd97vwpHwUZq5mL/view?usp=sharing"
                  target="_blank"
                  className="hover:text-gray-800 transition underline"
                >
                  Resume
                </a>
              </div>

              <div className="flex gap-4">
                <a
                  href="mailto:gurp3773@gmail.com"
                  className="hover:text-gray-700 transition"
                >
                  gurp3773@gmail.com
                </a>

                <a
                  href="https://github.com/mastacoda-98"
                  target="_blank"
                  className="hover:text-gray-700 transition"
                >
                  GitHub
                </a>

                <a
                  href="https://www.linkedin.com/in/gurpreet-singh-sarmotta-402a6a304/"
                  target="_blank"
                  className="hover:text-gray-700 transition"
                >
                  LinkedIn
                </a>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
