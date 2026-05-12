"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import api from "@/lib/api";

import { useAuth } from "@/context/authContext";

import { formatDecimal } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Card, CardContent } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { toast } from "sonner";

export default function ProfilePage() {
  const router = useRouter();

  const { user, isLoggedIn, loading: authLoading, setUser } = useAuth();

  const [portfolio, setPortfolio] = useState([]);

  const [stockPrices, setStockPrices] = useState({});

  const [recentTrades, setRecentTrades] = useState([]);

  const [loading, setLoading] = useState(true);

  const [addingFunds, setAddingFunds] = useState(false);

  const [creditsLoading, setCreditsLoading] = useState(false);

  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);

      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // PORTFOLIO
        const portfolioRes = await api.get("/api/me/portfolio");

        const holdings = portfolioRes.data.portfolio || [];

        setPortfolio(holdings);

        // CURRENT STOCK PRICES
        if (holdings.length) {
          const stockRequests = holdings.map((item) =>
            api.get(`/api/stocks/${item.symbol}`),
          );

          const stockResponses = await Promise.all(stockRequests);

          const prices = {};

          stockResponses.forEach((res) => {
            prices[res.data.symbol] = res.data.price;
          });

          setStockPrices(prices);
        }

        // USER TRADES ONLY
        const tradesRes = await api.get("/api/me/trades");

        const trades = tradesRes.data.trades || [];

        const sortedTrades = trades
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .slice(0, 20);

        setRecentTrades(sortedTrades);
      } catch (err) {
        console.error(err);

        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoggedIn, authLoading, user?.user_id]);

  const totalInvested = useMemo(() => {
    return portfolio.reduce(
      (sum, item) => sum + Number(item.total_invested || 0),
      0,
    );
  }, [portfolio]);

  const currentValue = useMemo(() => {
    return portfolio.reduce((sum, item) => {
      const currentPrice = stockPrices[item.symbol] || 0;

      return sum + currentPrice * Number(item.quantity || 0);
    }, 0);
  }, [portfolio, stockPrices]);

  const pnl = currentValue - totalInvested;

  const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

  const handleAddCredits = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount");

      return;
    }

    try {
      setCreditsLoading(true);

      await api.post("/api/me/credits/add", {
        amount: Number(amount),
      });

      const updatedUser = await api.get("/api/me");

      setUser(updatedUser.data);

      toast.success("Credits added successfully");

      setAmount("");

      setAddingFunds(false);
    } catch (err) {
      console.error(err);

      toast.error("Failed to add credits");
    } finally {
      setCreditsLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border border-gray-300 border-t-purple-700 animate-spin mx-auto" />

          <h2 className="mt-5 text-lg font-medium text-gray-900">
            Loading Profile
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Fetching account information...
          </p>

          <p className="mt-4 text-xs text-gray-400">
            If this gets stuck, try reloading the page.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6">
        <Card className="w-full max-w-md border border-gray-200 shadow-none rounded-md">
          <CardContent className="py-10 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Login Required
            </h1>

            <p className="mt-3 text-sm text-gray-500">
              Please login to access your profile.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <Button
                onClick={() => router.push("/auth/login")}
                className="rounded-md bg-purple-700 hover:bg-purple-800"
              >
                Login
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push("/auth/signup")}
                className="rounded-md"
              >
                Signup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] px-8 py-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* LEFT */}
        <div className="border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h1 className="text-xl font-semibold text-gray-900">Profile</h1>

            <p className="mt-1 text-xs text-gray-500">
              Account overview and funds.
            </p>
          </div>

          <div className="px-5 py-5">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  First Name
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {user?.first_name || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Last Name
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {user?.last_name || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Email
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="border border-gray-200 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">
                  Funds
                </p>

                <div className="mt-1 text-lg font-semibold text-gray-900">
                  ₹{formatDecimal(user?.credits || 0)}
                </div>
              </div>

              <div className="border border-gray-200 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">
                  Invested
                </p>

                <div className="mt-1 text-lg font-semibold text-gray-900">
                  ₹{formatDecimal(totalInvested)}
                </div>
              </div>

              <div className="col-span-2 border border-gray-200 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">
                  Profit / Loss
                </p>

                <div
                  className={`mt-1 text-lg font-semibold ${
                    pnl >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {pnl >= 0 ? "+" : ""}₹{formatDecimal(pnl)}
                </div>

                <p
                  className={`mt-1 text-xs ${
                    pnl >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {pnl >= 0 ? "+" : ""}
                  {pnlPercent.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="mt-6 border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Add Credits
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Add virtual funds to your account.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddingFunds((prev) => !prev)}
                  className="rounded-md border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  {addingFunds ? "Close" : "Add"}
                </Button>
              </div>

              {addingFunds && (
                <div className="mt-4 flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-9 rounded-md"
                  />

                  <Button
                    onClick={handleAddCredits}
                    disabled={creditsLoading}
                    className="h-9 rounded-md bg-purple-700 hover:bg-purple-800"
                  >
                    {creditsLoading ? "Adding..." : "Confirm"}
                  </Button>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => router.push("/portfolio")}
              className="mt-5 w-full rounded-md border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              Open Portfolio
            </Button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="border border-gray-200 bg-white flex flex-col">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Recent Trades
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Last 20 trades executed by your account.
            </p>
          </div>

          <div className="max-h-[620px] overflow-y-auto">
            {recentTrades.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-500">
                No recent trades
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow className="hover:bg-white">
                    <TableHead>Symbol</TableHead>

                    <TableHead>Side</TableHead>

                    <TableHead>Qty</TableHead>

                    <TableHead>Price</TableHead>

                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {recentTrades.map((trade, i) => {
                    const side =
                      trade?.seller_id == user?.user_id ? "SELL" : "BUY";

                    const sideClass =
                      side === "BUY"
                        ? "text-green-600 font-semibold"
                        : "text-red-600 font-semibold";

                    return (
                      <TableRow key={i} className="hover:bg-purple-50/40">
                        <TableCell className="font-semibold text-gray-900">
                          {trade.symbol}
                        </TableCell>

                        <TableCell className={sideClass}>{side}</TableCell>

                        <TableCell>{formatDecimal(trade.quantity)}</TableCell>

                        <TableCell className="font-medium">
                          ₹{formatDecimal(trade.price)}
                        </TableCell>

                        <TableCell className="text-right text-xs text-gray-500">
                          {new Date(trade.timestamp).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
