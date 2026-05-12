"use client";

import { useEffect, useState } from "react";
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

export default function OrdersPage() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);

        const res = await api.get("/api/orders");

        setOrders(res.data.orders || []);

        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isLoggedIn, authLoading]);

  const handleCancelOrder = async (orderId) => {
    try {
      setCancellingOrderId(orderId);

      await api.delete(`api/orders/${orderId}`);

      setOrders((prev) => prev.filter((order) => order.order_id !== orderId));
    } catch (err) {
      console.error(err);
      setError("Failed to cancel order");
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border border-gray-300 border-t-purple-700 animate-spin mx-auto" />

          <h2 className="mt-5 text-lg font-medium text-gray-900">
            Loading Orders
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Fetching your order history...
          </p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fafafa] px-6">
        <div className="w-full max-w-md border border-gray-200 bg-white px-8 py-10">
          <h1 className="text-2xl font-semibold text-gray-900">
            Login Required
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Please login to view your orders.
          </p>

          <div className="mt-6 flex gap-3">
            <Button onClick={() => router.push("/login")}>Login</Button>

            <Button variant="outline" onClick={() => router.push("/signup")}>
              Signup
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#fafafa] px-10 py-10 overflow-hidden flex flex-col">
      <div className="mx-auto max-w-7xl flex flex-col flex-1 min-h-0 min-w-0 w-full">
        <div className="flex items-end justify-between border-b border-gray-200 pb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Orders</h1>

            <p className="mt-2 text-sm text-gray-500">
              Your trade execution history
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="border-purple-200 hover:border-purple-300"
          >
            Back to Market
          </Button>
        </div>

        <div className="mt-8 h-[60vh] max-h-[650px] border border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">Order Book</h2>
          </div>

          {orders?.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-lg font-medium text-gray-900">
                No orders found
              </p>

              <p className="mt-2 text-sm text-gray-500">
                You haven’t placed any trades yet.
              </p>

              <Button
                className="mt-6 bg-purple-700 hover:bg-purple-800"
                onClick={() => router.push("/")}
              >
                Start Trading
              </Button>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto">
              <Table className="w-full min-w-[1050px]">
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead>Symbol</TableHead>

                    <TableHead>Side</TableHead>

                    <TableHead>Price</TableHead>

                    <TableHead>Quantity</TableHead>

                    <TableHead>Total</TableHead>

                    <TableHead>Timestamp</TableHead>

                    <TableHead>Expires At</TableHead>

                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {orders?.map((order) => {
                    const total = order.price * order.quantity;

                    return (
                      <TableRow
                        key={order.order_id}
                        className="hover:bg-gray-50"
                      >
                        <TableCell className="font-semibold text-gray-900">
                          {order.symbol}
                        </TableCell>

                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              order.side === "BUY"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {order.side}
                          </span>
                        </TableCell>

                        <TableCell>₹{formatDecimal(order.price)}</TableCell>

                        <TableCell>{formatDecimal(order.quantity)}</TableCell>

                        <TableCell className="font-medium">
                          ₹{formatDecimal(total)}
                        </TableCell>

                        <TableCell className="text-sm text-gray-500">
                          {new Date(order.timestamp).toLocaleString()}
                        </TableCell>

                        <TableCell className="text-sm text-gray-500">
                          {new Date(order.expires_at).toLocaleString()}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={cancellingOrderId === order.order_id}
                            onClick={() => handleCancelOrder(order.order_id)}
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          >
                            {cancellingOrderId === order.order_id
                              ? "Cancelling..."
                              : "Cancel"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}
