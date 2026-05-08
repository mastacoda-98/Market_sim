"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { Sora } from "next/font/google";

import api from "@/lib/api";
import { useAuth } from "@/context/authContext";

import { toast } from "sonner";

const sora = Sora({ subsets: ["latin"] });

export default function LoginPage() {
  const router = useRouter();

  const { isLoggedIn, loading, setIsLoggedIn, setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isLoggedIn) {
      router.push("/");
    }
  }, [loading, isLoggedIn, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      await api.post("/api/login", {
        email,
        password,
      });

      const me = await api.get("/api/me");

      setUser(me.data);
      setIsLoggedIn(true);

      toast.success("Logged in successfully");

      router.push("/");
    } catch (error) {
      toast.error("Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Loading...
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

      <div className="flex-1 flex items-center justify-center px-6">
        <Card className="w-full max-w-md border-gray-200 shadow-sm rounded-3xl">
          <CardHeader className="space-y-4">
            <div className="lg:hidden flex justify-center">
              <h1
                className={`${sora.className} text-4xl font-semibold tracking-tight`}
              >
                <span className="text-gray-700">trade</span>
                <span className="text-purple-700">Sim.</span>
              </h1>
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl font-semibold text-gray-900">
                Welcome back
              </h2>

              <CardDescription className="text-gray-500 text-base">
                Sign in to continue trading
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>

                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-gray-300 focus-visible:ring-purple-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Password
                </Label>

                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-gray-300 focus-visible:ring-purple-600"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-medium text-base"
              >
                {submitting ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
