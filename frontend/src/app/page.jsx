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

  const [fetchingData, setFetchingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingData(true);

        const stocksRes = await api.get("/api/stocks");

        const tradePromises = stocksRes.data.map((stock) =>
          api.get(`/api/trades/${stock.symbol}`),
        );

        const tradeResponses = await Promise.all(tradePromises);

        const stocksWithChange = stocksRes.data.map((stock, idx) => {
          const stockTrades = tradeResponses[idx].data.trades || [];

          let change = 0;

          if (stockTrades.length >= 2) {
            const recentTrades = stockTrades.slice(0, 10);

            const oldTrades =
              stockTrades.length >= 20
                ? stockTrades.slice(10, 20)
                : stockTrades.slice(
                    Math.floor(stockTrades.length / 2),
                    stockTrades.length,
                  );

            const recentAvg =
              recentTrades.reduce((sum, trade) => sum + trade.price, 0) /
              recentTrades.length;

            const oldAvg =
              oldTrades.reduce((sum, trade) => sum + trade.price, 0) /
              oldTrades.length;

            if (oldAvg !== 0) {
              change = ((recentAvg - oldAvg) / oldAvg) * 100;
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
      } finally {
        setFetchingData(false);
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

  if (loading || fetchingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center -mt-20">
        <div className="text-center">
          <div className="h-10 w-10 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin mx-auto" />

          <p className="mt-5 text-gray-600 font-medium">
            Loading market data...
          </p>

          <p className="mt-2 text-sm text-gray-400">
            If this takes too long, try reloading the page.
          </p>
        </div>
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
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />

              <h1
                className={`${sora.className} text-base font-medium text-gray-500`}
              >
                Live Simulated Market
              </h1>
            </div>

            <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
              <span>{stocks.length} Stocks</span>

              <span>•</span>

              <span className="text-green-600 font-medium">Market Open</span>

              <span>•</span>

              <span>Real-time Matching</span>
            </div>

            <p className="mt-3 text-sm text-gray-400">
              Percentage change is calculated from the last 20 executed trades.
            </p>

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

                    <div className="text-xs text-gray-400 mt-2"></div>
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

            <p className="mt-6 text-sm text-gray-400">
              Live price reflects the most recent executed trade for each stock.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-1/2 flex justify-start pl-14">
          <div className="w-full max-w-[520px]">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />

              <h1
                className={`${sora.className} text-base font-medium text-gray-500`}
              >
                Live Trades
              </h1>
            </div>

            <div className="mt-4 flex flex-col gap-1">
              {trades.map((trade, i) => (
                <div
                  key={`${trade.symbol}-${trade.timestamp}-${i}`}
                  className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-100 transition-all duration-300 animate-in fade-in slide-in-from-top-1"
                >
                  <div>
                    <div
                      className={`${plex.className} text-lg font-semibold text-gray-900`}
                    >
                      {trade.symbol}
                    </div>

                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(trade.timestamp).toLocaleTimeString()}
                    </div>
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

            <p className="mt-6 text-sm text-gray-400">
              Trades are streamed live as orders are matched in the market.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
