"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "@/lib/api";

import { formatDecimal } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { useAuth } from "@/context/authContext";

import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
} from "@/components/ui/table";

import OrderDialog from "@/app/stocks/orderDialog";

export default function StockPage() {
  const { symbol } = useParams();

  const router = useRouter();

  const { isLoggedIn } = useAuth();

  const [stock, setStock] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [lastTrade, setLastTrade] = useState(null);

  const [orderbook, setOrderbook] = useState(null);

  const [animateTrade, setAnimateTrade] = useState(false);

  const [chartData, setChartData] = useState([]);

  const chartDataRef = useRef([]);

  useEffect(() => {
    if (!lastTrade) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnimateTrade(true);

    const timeout = setTimeout(() => {
      setAnimateTrade(false);
    }, 180);

    return () => clearTimeout(timeout);
  }, [lastTrade]);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        setLoading(true);

        const [stockRes, orderbookRes, tradesRes] = await Promise.all([
          api.get(`/api/stocks/${symbol}`),

          api.get(`/api/orderbook/${symbol}`),

          api.get(`/api/trades/${symbol}`),
        ]);

        setStock(stockRes.data);

        setOrderbook(orderbookRes.data);

        const trades = tradesRes.data.trades || [];

        const formattedChartData = [...trades]
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          )
          .map((trade) => ({
            time: new Date(trade.timestamp).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),

            price: Number(trade.price),
          }))
          .slice(-80);

        chartDataRef.current = formattedChartData;

        setChartData(formattedChartData);

        setError(null);
      } catch (err) {
        console.error("Something went wrong:", err);

        setError("Stock not found");

        setStock(null);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchStock();
    }
  }, [symbol, isLoggedIn]);

  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/${symbol}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.price) {
        setStock((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            price: data.price,
          };
        });

        setLastTrade((prev) => ({
          price: data.price,

          quantity: data.quantity || 0,

          direction: !prev || data.price >= prev.price ? "up" : "down",
        }));

        const newPoint = {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),

          price: Number(data.price),
        };

        const updated = [...chartDataRef.current, newPoint].slice(-80);

        chartDataRef.current = updated;

        setChartData(updated);
      }
    };

    ws.onopen = () => {
      console.log("WS connected");
    };

    ws.onclose = () => {
      console.log("WS closed");
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => ws.close();
  }, [symbol]);

  const buyOrders = useMemo(() => {
    return orderbook?.buy_orders
      ? [...orderbook.buy_orders].sort((a, b) => b.price - a.price)
      : [];
  }, [orderbook]);

  const sellOrders = useMemo(() => {
    return orderbook?.sell_orders
      ? [...orderbook.sell_orders].sort((a, b) => a.price - b.price)
      : [];
  }, [orderbook]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <div className="h-9 w-9 rounded-full border border-gray-300 border-t-purple-700 animate-spin mx-auto" />

          <h2 className="mt-5 text-lg font-medium text-gray-900">
            Loading Stock
          </h2>

          <p className="mt-2 text-sm text-gray-500">Fetching market data...</p>

          <p className="mt-4 text-xs text-gray-400">
            If this gets stuck, try refreshing.
          </p>
        </div>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>

          <p className="text-lg text-gray-600 mb-8">
            Stock <span className="font-semibold">{symbol}</span> does not exist
          </p>

          <Button
            onClick={() => router.push("/")}
            className="bg-purple-700 hover:bg-purple-800"
          >
            Back to Market
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] px-8 py-8">
      <div className="mx-auto flex max-w-7xl gap-6">
        {/* LEFT */}
        <div className="w-[420px] border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                  {stock.symbol}
                </h1>

                <p className="mt-1 text-sm text-gray-500">{stock.stock_name}</p>
              </div>

              <div className="flex gap-2">
                <OrderDialog
                  type="buy"
                  symbol={stock.symbol}
                  currentPrice={stock.price}
                />

                <OrderDialog
                  type="sell"
                  symbol={stock.symbol}
                  currentPrice={stock.price}
                />
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between">
              <div>
                <div className="text-4xl font-semibold tracking-tight text-gray-900">
                  ₹{formatDecimal(stock.price)}
                </div>

                <p className="mt-1 text-xs text-gray-500">Live market price</p>
              </div>

              {lastTrade && (
                <div
                  key={`${lastTrade.price}-${lastTrade.quantity}`}
                  className={`
                    transition-all duration-200
                    ${
                      animateTrade
                        ? "scale-110 opacity-70"
                        : "scale-100 opacity-100"
                    }
                  `}
                >
                  <div className="text-xs text-gray-400">Last Trade</div>

                  <div
                    className={`mt-1 text-sm font-medium ${
                      lastTrade.direction === "up"
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {formatDecimal(lastTrade.quantity)} @ ₹
                    {formatDecimal(lastTrade.price)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Orderbook</h2>

              <div className="rounded-md bg-purple-50 px-2 py-1 text-[11px] font-medium text-purple-700">
                Live
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="text-red-600">Ask Qty</TableHead>

                    <TableHead className="text-red-600">Ask Price</TableHead>

                    <TableHead className="text-green-700">Bid Price</TableHead>

                    <TableHead className="text-right text-green-700">
                      Bid Qty
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {Array.from({
                    length: Math.min(
                      Math.max(buyOrders.length, sellOrders.length),
                      8,
                    ),
                  }).map((_, i) => {
                    const ask = sellOrders?.[i];

                    const bid = buyOrders?.[i];

                    return (
                      <TableRow key={i}>
                        <TableCell>{formatDecimal(ask?.quantity)}</TableCell>

                        <TableCell className="font-medium text-red-500">
                          {ask ? `₹${formatDecimal(ask.price)}` : "-"}
                        </TableCell>

                        <TableCell className="font-medium text-green-600">
                          {bid ? `₹${formatDecimal(bid.price)}` : "-"}
                        </TableCell>

                        <TableCell className="text-right">
                          {formatDecimal(bid?.quantity)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Price Chart
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Trade price movement from the last 3 days.
                </p>
              </div>

              <div className="rounded-md bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                Real-time updates
              </div>
            </div>
          </div>

          <div className="h-[620px] w-full px-4 py-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id="purpleGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#7e22ce" stopOpacity={0.35} />

                    <stop
                      offset="100%"
                      stopColor="#7e22ce"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />

                <XAxis
                  dataKey="time"
                  tick={{
                    fontSize: 11,
                    fill: "#6b7280",
                  }}
                  minTickGap={30}
                />

                <YAxis
                  domain={["auto", "auto"]}
                  tick={{
                    fontSize: 11,
                    fill: "#6b7280",
                  }}
                  tickFormatter={(value) => `₹${value}`}
                />

                <Tooltip
                  formatter={(value) => [`₹${formatDecimal(value)}`, "Price"]}
                />

                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#7e22ce"
                  strokeWidth={3}
                  fill="url(#purpleGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
