"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import { useAuth } from "@/context/authContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { Sora } from "next/font/google";

import api from "@/lib/api";
import { toast } from "sonner";

const sora = Sora({ subsets: ["latin"] });

export default function SignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const { loading, isLoggedIn } = useAuth();

  useEffect(() => {
    if (!loading && isLoggedIn) {
      router.push("/");
    }
  }, [loading, isLoggedIn, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      await api.post("/api/users", {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });

      toast.success("Account created successfully");

      router.push("/auth/login");
    } catch (error) {
      toast.error("Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:flex flex-1 items-center justify-center bg-linear-to-br from-purple-100 via-white to-purple-50 border-r border-gray-200">
        <div className="max-w-xl px-12 -mt-40">
          <h1 className={`${sora.className} text-6xl font-bold tracking-tight`}>
            <span className="text-gray-800">trade</span>
            <span className="text-purple-700">Sim.</span>
          </h1>

          <p className="mt-6 text-lg text-gray-600 leading-relaxed italic">
            Create an account and start simulating real-world trading with live
            orderbooks and portfolio tracking.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 -mt-36">
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
                Create account
              </h2>

              <CardDescription className="text-gray-500 text-base">
                Sign up to start trading simulation
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-purple-700 hover:bg-purple-800 text-white"
              >
                {submitting ? "Creating..." : "Sign Up"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
