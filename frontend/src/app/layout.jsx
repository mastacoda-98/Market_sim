"use client";

import "./globals.css";

import { Inter, Sora } from "next/font/google";

import { AuthProvider, useAuth } from "@/context/authContext";

import { Button } from "@/components/ui/button";

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

function Navbar() {
  const { isLoggedIn, setIsLoggedIn, setUser, user } = useAuth();

  const handleLogout = async () => {
    try {
      await api.post("/api/logout");

      setUser(null);
      setIsLoggedIn(false);

      toast.success("Logged out");

      window.location.href = "/auth/login";
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  return (
    <nav className="sticky top-0 z-50 h-16 bg-white/95 border-b border-gray-200 flex items-center px-6 backdrop-blur-sm">
      <div
        className={`${sora.className} text-purple-700 font-bold text-3xl flex items-center justify-between w-full px-8`}
      >
        <button
          onClick={() => (window.location.href = "/")}
          className="hover:text-purple-900 transition-colors duration-300 cursor-pointer"
        >
          <span className="text-gray-800">trade</span>
          <span className="text-purple-700">Sim.</span>
        </button>

        {isLoggedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="outline-none cursor-pointer">
                <Avatar className="h-10 w-10 border border-gray-300">
                  <AvatarFallback className="bg-purple-700 text-white text-sm">
                    {user?.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44 rounded-2xl">
              <DropdownMenuItem
                onClick={() => (window.location.href = "/profile")}
                className="cursor-pointer"
              >
                Profile
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-500 focus:text-red-500"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            onClick={() => (window.location.href = "/auth/login")}
            className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl"
          >
            Login
          </Button>
        )}
      </div>
    </nav>
  );
}

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
              <div>Built by Gurpreet Singh • TradeSim</div>

              <div className="flex gap-4">
                <a
                  href="mailto:yourmail@gmail.com"
                  className="hover:text-gray-700 transition"
                >
                  Gmail
                </a>

                <a
                  href="https://github.com/mastacoda-98"
                  target="_blank"
                  className="hover:text-gray-700 transition"
                >
                  GitHub
                </a>

                <a
                  href="https://linkedin.com/in/yourlinkedin"
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
