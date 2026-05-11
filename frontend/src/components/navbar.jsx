"use client";

import { useEffect, useMemo, useState } from "react";

import { Sora } from "next/font/google";

import { useRouter } from "next/navigation";

import { useAuth } from "@/context/authContext";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { toast } from "sonner";

import api from "@/lib/api";

const sora = Sora({
  subsets: ["latin"],
});

export default function Navbar() {
  const { isLoggedIn, setIsLoggedIn, setUser, user } = useAuth();

  const router = useRouter();

  const [portfolio, setPortfolio] = useState([]);

  const [stockPrices, setStockPrices] = useState({});

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchPortfolioData = async () => {
      try {
        const portfolioRes = await api.get("/api/me/portfolio");

        const holdings = portfolioRes.data.portfolio || [];

        setPortfolio(holdings);

        if (!holdings.length) return;

        const stockRequests = holdings.map((item) =>
          api.get(`/api/stocks/${item.symbol}`),
        );

        const stockResponses = await Promise.all(stockRequests);

        const prices = {};

        stockResponses.forEach((res) => {
          prices[res.data.symbol] = res.data.price;
        });

        setStockPrices(prices);
      } catch (err) {
        console.error("Failed to fetch portfolio pnl", err);
      }
    };

    fetchPortfolioData();
  }, [isLoggedIn]);

  const pnl = useMemo(() => {
    return portfolio.reduce((sum, item) => {
      const currentPrice = stockPrices[item.symbol] || 0;

      const currentValue = currentPrice * Number(item.quantity || 0);

      return sum + (currentValue - Number(item.total_invested || 0));
    }, 0);
  }, [portfolio, stockPrices]);

  const handleLogout = async () => {
    try {
      await api.post("/api/logout");

      setUser(null);

      setIsLoggedIn(false);

      toast.success("Logged out");

      router.push("/auth/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <nav className="sticky top-0 z-50 h-16 bg-white/95 border-b border-gray-200 flex items-center px-6 backdrop-blur-sm">
      <div className="w-full flex items-center justify-between px-8">
        {/* LEFT */}
        <div className="flex items-center gap-12">
          <button
            onClick={() => router.push("/")}
            className={`${sora.className} text-3xl font-bold hover:opacity-80 transition cursor-pointer`}
          >
            <span className="text-gray-800">trade</span>

            <span className="text-purple-700">Sim.</span>
          </button>

          {isLoggedIn && (
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <button
                onClick={() => router.push("/")}
                className="hover:text-purple-700 transition"
              >
                Markets
              </button>

              <button
                onClick={() => router.push("/portfolio")}
                className="hover:text-purple-700 transition"
              >
                Portfolio
              </button>

              <button
                onClick={() => router.push("/orders")}
                className="hover:text-purple-700 transition"
              >
                Orders
              </button>
            </div>
          )}
        </div>
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
          <div className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
          Running simulated trading bots
        </div>
        {/* RIGHT */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <div className="hidden md:flex items-center gap-5 text-sm">
                <div className="text-gray-500">
                  Funds:&nbsp;
                  <span className="font-semibold text-gray-800">
                    ₹{user?.credits?.toLocaleString?.() || "0"}
                  </span>
                </div>

                <div
                  className={`font-semibold ${
                    pnl >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {pnl >= 0 ? "+" : "-"}₹
                  {Math.abs(pnl).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>

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

                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
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
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => router.push("/auth/login")}
                className="bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 rounded-lg"
              >
                Login
              </Button>

              <Button
                onClick={() => router.push("/auth/signup")}
                className="bg-purple-700 hover:bg-purple-800 text-white rounded-lg"
              >
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
