"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/authContext";
import { Table, TableHeader } from "@/components/ui/table";

export default function StockPage() {
  const { symbol } = useParams();
  const router = useRouter();

  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastTrade, setLastTrade] = useState(null);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchStock = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/stocks/${symbol}`);
        setStock(res.data);
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
            <Button className="h-8 px-4 text-xs rounded-lg bg-green-200 border-green-600 text-green hover:bg-green-300">
              Buy
            </Button>

            <Button className="h-8 px-4 text-xs rounded-lg bg-red-200 border-red-600 text-red hover:bg-red-300">
              Sell
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-3xl font-semibold text-gray-900">
            ₹{stock.price}
          </div>
          {lastTrade && (
            <div
              className={`text-sm font-medium ${
                lastTrade.direction === "up" ? "text-green-600" : "text-red-500"
              }`}
            >
              {lastTrade.quantity} @ ₹{lastTrade.price}
            </div>
          )}
        </div>
        <Table>
          <TableHeader className="text-2xl text-purple-700 font-bold">
            Orderbook
          </TableHeader>
        </Table>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Chart Area (coming soon)
      </div>
    </div>
  );
}
