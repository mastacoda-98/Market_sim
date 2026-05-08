"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/context/authContext";

import { Sora, IBM_Plex_Sans } from "next/font/google";

import api from "@/lib/api";

const sora = Sora({
  subsets: ["latin"],
});

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["500", "600"],
});

export default function Home() {
  const { loading } = useAuth();

  const router = useRouter();

  const [stocks, setStocks] = useState([]);

  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stocksRes = await api.get("/api/stocks");

        const tradePromises = stocksRes.data.map((stock) =>
          api.get(`/api/trades/${stock.symbol}`),
        );

        const tradeResponses = await Promise.all(tradePromises);

        const stocksWithChange = stocksRes.data.map((stock, idx) => {
          const stockTrades = tradeResponses[idx].data.trades || [];

          let change = 0;

          if (stockTrades.length >= 2) {
            const latest = stockTrades[0].price;
            const oldest =
              stockTrades[Math.min(stockTrades.length - 1, 19)].price;

            if (oldest !== 0) {
              change = ((latest - oldest) / oldest) * 100;
            }
          }

          return {
            ...stock,
            change,
          };
        });

        setStocks(stocksWithChange);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!stocks.length) return;

    const sockets = stocks.map((stock) => {
      const ws = new WebSocket(`ws://localhost:8000/ws/${stock.symbol}`);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.price) {
          setStocks((prev) =>
            prev.map((s) =>
              s.symbol === stock.symbol
                ? {
                    ...s,
                    price: data.price,
                  }
                : s,
            ),
          );

          setTrades((prev) => {
            const newTrade = {
              symbol: stock.symbol,
              quantity: data.quantity || 0,
              price: data.price,
              timestamp: new Date().toISOString(),
            };

            return [newTrade, ...prev].slice(0, 20);
          });
        }
      };

      ws.onopen = () => {
        console.log(`${stock.symbol} WS connected`);
      };

      ws.onclose = () => {
        console.log(`${stock.symbol} WS closed`);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      return ws;
    });

    return () => {
      sockets.forEach((ws) => {
        ws.close();
      });
    };
  }, [stocks.length]);

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-16 py-10">
      <div className="relative flex min-h-[80vh]">
        {/* CENTER LINE */}
        <div className="absolute left-1/2 top-6 bottom-6 w-px bg-gray-200 -translate-x-1/2" />

        {/* LEFT */}
        <div className="w-1/2 flex justify-end pr-14">
          <div className="w-full max-w-[620px]">
            <h1
              className={`${sora.className} text-base font-medium text-gray-500`}
            >
              Live Simulated Market
            </h1>

            <div className="mt-6 flex flex-col gap-1">
              {stocks.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => router.push(`/stocks/${stock.symbol}`)}
                  className="w-full flex items-center justify-between px-6 py-5 rounded-2xl hover:bg-gray-100 transition text-left"
                >
                  <div>
                    <div
                      className={`${plex.className} text-2xl font-semibold text-gray-900 tracking-tight`}
                    >
                      {stock.symbol}
                    </div>

                    <div className="text-sm text-gray-500 mt-1">
                      {stock.stock_name}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div
                      className={`text-sm font-semibold ${
                        stock.change >= 0 ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {stock.change >= 0 ? "+" : ""}
                      {stock.change?.toFixed(2)}%
                    </div>

                    <div
                      className={`${plex.className} text-xl font-semibold text-gray-800 min-w-[90px] text-right`}
                    >
                      ₹{stock.price}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-1/2 flex justify-start pl-14">
          <div className="w-full max-w-[520px]">
            <h1
              className={`${sora.className} text-base font-medium text-gray-500`}
            >
              Live Trades
            </h1>

            <div className="mt-4 flex flex-col">
              {trades.map((trade, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-gray-100 transition"
                >
                  <div
                    className={`${plex.className} text-lg font-semibold text-gray-900`}
                  >
                    {trade.symbol}
                  </div>

                  <div className="flex items-center gap-5 text-sm">
                    <div className="text-gray-500">Qty {trade.quantity}</div>

                    <div
                      className={`${plex.className} font-semibold text-gray-800`}
                    >
                      ₹{trade.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
