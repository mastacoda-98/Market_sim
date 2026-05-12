"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import api from "@/lib/api";

import { useAuth } from "@/context/authContext";

import { formatDecimal } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PortfolioPage() {
  const router = useRouter();

  const { isLoggedIn, loading: authLoading } = useAuth();

  const [portfolio, setPortfolio] = useState([]);

  const [stockPrices, setStockPrices] = useState({});

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    const fetchPortfolio = async () => {
      try {
        setLoading(true);

        const portfolioRes = await api.get("/api/me/portfolio");

        const holdings = portfolioRes.data.portfolio || [];

        setPortfolio(holdings);

        const stockRequests = holdings.map((item) =>
          api.get(`/api/stocks/${item.symbol}`),
        );

        const stockResponses = await Promise.all(stockRequests);

        const prices = {};

        stockResponses.forEach((res) => {
          prices[res.data.symbol] = res.data.price;
        });

        setStockPrices(prices);

        setError(null);
      } catch (err) {
        console.error(err);

        setError("Failed to load portfolio");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [isLoggedIn, authLoading]);

  const totalInvestment = useMemo(() => {
    return portfolio.reduce(
      (sum, item) => sum + Number(item.total_invested || 0),
      0,
    );
  }, [portfolio]);

  const currentValue = useMemo(() => {
    return portfolio.reduce((sum, item) => {
      const currentPrice = stockPrices[item.symbol] || 0;

      return sum + currentPrice * item.quantity;
    }, 0);
  }, [portfolio, stockPrices]);

  const totalPnL = currentValue - totalInvestment;

  const totalPnLPercent =
    totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border border-gray-300 border-t-gray-800 animate-spin mx-auto" />

          <h2 className="mt-5 text-lg font-medium text-gray-900">
            Loading Portfolio
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Fetching your holdings and positions...
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
        <div className="w-full max-w-md border border-gray-200 bg-white px-8 py-10">
          <h1 className="text-2xl font-semibold text-gray-900">
            Login Required
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Please login or signup to access your portfolio.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Button
              onClick={() => router.push("/login")}
              className="h-10 rounded-md"
            >
              Login
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/signup")}
              className="h-10 rounded-md"
            >
              Signup
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] px-10 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Portfolio
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Holdings and simulated investment performance.
            </p>
          </div>

          <div className="flex items-center gap-10">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Invested
              </p>

              <div className="mt-1 text-xl font-semibold text-gray-900">
                ₹{formatDecimal(totalInvestment)}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Current
              </p>

              <div className="mt-1 text-xl font-semibold text-gray-900">
                ₹{formatDecimal(currentValue)}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                P/L
              </p>

              <div
                className={`mt-1 text-xl font-semibold ${
                  totalPnL >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {totalPnL >= 0 ? "+" : ""}₹{formatDecimal(totalPnL)}
              </div>

              <div
                className={`text-xs mt-1 ${
                  totalPnL >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {totalPnL >= 0 ? "+" : ""}
                {totalPnLPercent.toFixed(2)}%
              </div>
            </div>

            <Button
              variant="outline"
              className="rounded-md"
              onClick={() => router.push("/")}
            >
              Back to Market
            </Button>
          </div>
        </div>

        <div className="mt-8 border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Holdings</h2>

              <p className="mt-1 text-sm text-gray-500">
                Click a stock to open its market page.
              </p>
            </div>
          </div>

          {portfolio.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg font-medium text-gray-900">
                No holdings yet
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Your portfolio is currently empty.
              </p>

              <Button
                className="mt-6 rounded-md"
                onClick={() => router.push("/")}
              >
                Explore Market
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead>Symbol</TableHead>

                  <TableHead>Quantity</TableHead>

                  <TableHead>Avg Buy</TableHead>

                  <TableHead>Current Price</TableHead>

                  <TableHead>Invested</TableHead>

                  <TableHead>Current Value</TableHead>

                  <TableHead>P/L</TableHead>

                  <TableHead className="text-right">Last Updated</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {portfolio.map((item) => {
                  const currentPrice = stockPrices[item.symbol] || 0;

                  const currentValue = currentPrice * Number(item.quantity);

                  const pnl = currentValue - Number(item.total_invested);

                  const pnlPercent =
                    item.total_invested > 0
                      ? (pnl / item.total_invested) * 100
                      : 0;

                  return (
                    <TableRow
                      key={item.symbol}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/stocks/${item.symbol}`)}
                    >
                      <TableCell className="font-semibold text-gray-900">
                        {item.symbol}
                      </TableCell>

                      <TableCell>{formatDecimal(item.quantity)}</TableCell>

                      <TableCell>
                        ₹{formatDecimal(item.average_buy_price)}
                      </TableCell>

                      <TableCell>₹{formatDecimal(currentPrice)}</TableCell>

                      <TableCell>
                        ₹{formatDecimal(item.total_invested)}
                      </TableCell>

                      <TableCell className="font-medium">
                        ₹{formatDecimal(currentValue)}
                      </TableCell>

                      <TableCell>
                        <div
                          className={`font-medium ${
                            pnl >= 0 ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {pnl >= 0 ? "+" : ""}₹{formatDecimal(pnl)}
                        </div>

                        <div
                          className={`text-xs mt-1 ${
                            pnl >= 0 ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {pnl >= 0 ? "+" : ""}
                          {pnlPercent.toFixed(2)}%
                        </div>
                      </TableCell>

                      <TableCell className="text-right text-sm text-gray-500">
                        {new Date(item.updated_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        <p className="mt-6 text-xs text-gray-400">
          Portfolio values are derived from simulated trades and latest traded
          prices.
        </p>
      </div>
    </div>
  );
}
