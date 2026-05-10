"use client";

import { useEffect, useMemo, useState } from "react";

import api from "@/lib/api";

import { useAuth } from "@/context/authContext";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { toast } from "sonner";

export default function OrderDialog({ type, symbol, currentPrice }) {
  const { isLoggedIn } = useAuth();

  const [open, setOpen] = useState(false);

  const [price, setPrice] = useState(currentPrice || "");

  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrice(currentPrice || "");
  }, [currentPrice]);

  const total = useMemo(() => {
    const p = Number(price);

    const q = Number(quantity);

    if (!p || !q) return 0;

    return p * q;
  }, [price, quantity]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      toast.error("Please login or signup to place orders");
      return;
    }

    if (!price || !quantity) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/order", {
        symbol,
        side: type.toUpperCase(),
        price: Number(price),
        quantity: Number(quantity),
      });

      toast.success(
        `${type === "buy" ? "Buy" : "Sell"} order placed successfully`,
      );

      setOpen(false);

      setQuantity("");
    } catch (err) {
      console.error(err);

      toast.error(err?.response?.data?.detail || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={`h-9 px-4 text-xs rounded-lg border transition-colors
            ${
              type === "buy"
                ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-300"
                : "bg-red-100 text-red-700 hover:bg-red-200 border-red-300"
            }
          `}
        >
          {type === "buy" ? "Buy" : "Sell"}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="
    sm:max-w-[420px]
    rounded-xl
    border
    border-gray-200
    shadow-md
    p-0
    overflow-hidden
    duration-100
    data-[state=open]:animate-in
    data-[state=closed]:animate-out
    data-[state=open]:fade-in-0
    data-[state=closed]:fade-out-0
    data-[state=open]:zoom-in-95
    data-[state=closed]:zoom-out-95
  "
      >
        <div className="px-6 py-5 border-b bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xl font-semibold text-gray-900">
                  {type === "buy" ? "Buy" : "Sell"} {symbol}
                </span>

                <span className="text-sm text-gray-500 mt-1">
                  Place a simulated market order
                </span>
              </div>

              <div
                className={`text-xs font-medium px-2.5 py-1 rounded-md
                  ${
                    type === "buy"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }
                `}
              >
                ₹{Number(currentPrice || 0).toFixed(2)}
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-gray-600">Price</Label>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                ₹
              </span>

              <Input
                type="number"
                step="0.01"
                placeholder="Enter price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-11 rounded-lg pl-8 border-gray-200"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm text-gray-600">Quantity</Label>

            <Input
              type="number"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-11 rounded-lg border-gray-200"
            />
          </div>

          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Estimated Total</span>

              <span className="text-2xl font-semibold text-gray-900 tracking-tight">
                ₹{total.toFixed(2)}
              </span>
            </div>

            <div className="mt-2 text-xs text-gray-400">
              {price && quantity
                ? `${quantity} shares × ₹${Number(price).toFixed(2)}`
                : "Enter price and quantity"}
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className={`mt-1 h-11 rounded-lg text-white text-sm font-medium transition-colors
              ${
                type === "buy"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            `}
          >
            {loading
              ? "Placing Order..."
              : `${type === "buy" ? "Buy" : "Sell"} Order`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
