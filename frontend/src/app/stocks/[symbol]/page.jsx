"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { formatDecimal } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/authContext";
import {
  Table,
  TableHeader,
  TableBody,
  TableCaption,
  TableCell,
  TableRow,
  TableFooter,
  TableHead,
} from "@/components/ui/table";

import OrderDialog from "@/app/stocks/orderDialog";

export default function StockPage() {
  const { symbol } = useParams();
  const router = useRouter();

  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastTrade, setLastTrade] = useState(null);
  const { isLoggedIn } = useAuth();
  const [orderbook, setOrderbook] = useState(null);

  const [animateTrade, setAnimateTrade] = useState(false);

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
        const res = await api.get(`/api/stocks/${symbol}`);
        const orderbookRes = await api.get(`/api/orderbook/${symbol}`);
        setStock(res.data);
        setOrderbook(orderbookRes.data);
        setError(null);
      } catch (err) {
        console.error("Somethings wrong: ", err);
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
    const ws = new WebSocket(`ws://localhost:8000/ws/${symbol}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.price) {
        setStock((prev) => {
          if (!prev) return prev;
          return { ...prev, price: data.price };
        });

        setLastTrade((prev) => ({
          price: data.price,
          quantity: data.quantity || 0,
          direction: !prev ? "up" : data.price >= prev.price ? "up" : "down",
        }));
      }
    };

    ws.onopen = () => {
      console.log("WS connected");
    };

    ws.onclose = () => {
      console.log("WS closed");
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);

    return () => ws.close();
  }, [symbol]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading stock...
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">
            Stock <span className="font-semibold">{symbol}</span> does not exist
          </p>
          <Button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => router.push("/")}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const buyOrders = orderbook?.buy_orders
    ? [...orderbook.buy_orders].sort((a, b) => b.price - a.price)
    : [];

  const sellOrders = orderbook?.sell_orders
    ? [...orderbook.sell_orders].sort((a, b) => a.price - b.price)
    : [];

  return (
    <div className="min-h-screen flex bg-gray-50 px-16 py-8">
      <div className="w-105 border-r border-gray-200 px-10 py-8 flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
              {stock.symbol}
            </h1>

            <p className="text-sm text-gray-500 mt-1">{stock.stock_name}</p>
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

        <div className="flex items-center justify-between">
          <div className="text-3xl font-semibold text-gray-900">
            ₹{formatDecimal(stock.price)}
          </div>

          {lastTrade && (
            <div
              key={`${lastTrade.price}-${lastTrade.quantity}`}
              className={`
      text-sm font-medium transition-all duration-200
      ${animateTrade ? "scale-110 opacity-70" : "scale-100 opacity-100"}
      ${lastTrade.direction === "up" ? "text-green-600" : "text-red-500"}
    `}
            >
              <span className="text-gray-400 mr-1">Last Trade</span>
              {formatDecimal(lastTrade.quantity)} @ ₹
              {formatDecimal(lastTrade.price)}
            </div>
          )}
        </div>

        <div className="mt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Orderbook
          </h2>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="text-red-600 font-semibold">
                    Ask Qty
                  </TableHead>

                  <TableHead className="text-red-600 font-semibold">
                    Ask Price
                  </TableHead>

                  <TableHead className="text-green-700 font-semibold">
                    Bid Price
                  </TableHead>

                  <TableHead className="text-green-700 font-semibold text-right">
                    Bid Qty
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {Array.from({
                  length: Math.min(
                    Math.max(buyOrders.length, sellOrders.length),
                    6,
                  ),
                }).map((_, i) => {
                  const ask = sellOrders?.[i];
                  const bid = buyOrders?.[i];

                  return (
                    <TableRow key={i}>
                      <TableCell>{formatDecimal(ask?.quantity)}</TableCell>

                      <TableCell className="text-red-500 font-medium">
                        {ask ? `₹${formatDecimal(ask.price)}` : "-"}
                      </TableCell>

                      <TableCell className="text-green-600 font-medium">
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

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Chart Area (coming soon)
      </div>
    </div>
  );
}
