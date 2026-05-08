"use client";

import { useAuth } from "@/context/authContext";

import { Sora } from "next/font/google";

const sora = Sora({
  subsets: ["latin"],
});

export default function Home() {
  const { user, isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center text-6xl font-semibold text-gray-800">
        Welcome, {user.first_name}!
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:flex flex-1 items-center justify-center bg-linear-to-br from-purple-100 via-white to-purple-50 border-r border-gray-200">
        <div className="max-w-xl px-12">
          <h1 className={`${sora.className} text-6xl font-bold tracking-tight`}>
            <span className="text-gray-800">trade</span>
            <span className="text-purple-700">Sim.</span>
          </h1>

          <p className="mt-6 text-lg text-gray-600 leading-relaxed italic">
            Simulate markets, execute trades, and experience a live trading
            environment with real-time orderbooks and portfolio tracking. Be
            like her
          </p>

          <div className="mt-10 h-72 overflow-hidden rounded-3xl border bg-black">
            <iframe
              src="https://tenor.com/embed/9890897446043029562"
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-10">
        <div className="max-w-2xl">
          <h2 className="text-5xl font-bold tracking-tight text-gray-900 leading-tight">
            Experience simulated trading with live order matching.
          </h2>

          <p className="mt-6 text-lg text-gray-600 leading-relaxed">
            Build strategies, compete with friends, and explore a realistic
            market simulation platform powered by real-time execution and
            websocket updates.
          </p>
        </div>
      </div>
    </div>
  );
}
