"use client";

import { useState } from "react";

const plans = [
  { id: "1m", label: "1 Month", price: "$10" },
  { id: "3m", label: "3 Months", price: "$27 (save 10%)" },
  { id: "6m", label: "6 Months", price: "$50 (save 15%)" },
  { id: "12m", label: "12 Months", price: "$90 (save 25%)" },
];

export default function Plans() {
  const [loading, setLoading] = useState(false);

  const checkout = async (plan: string) => {
    setLoading(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url; // redirect to Stripe Checkout
    } else {
      alert(data.error || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 max-w-md mx-auto">
      {plans.map((p) => (
        <button
          key={p.id}
          className="border p-4 rounded-xl hover:bg-gray-100"
          onClick={() => checkout(p.id)}
          disabled={loading}
        >
          <div className="text-lg font-bold">{p.label}</div>
          <div>{p.price}</div>
        </button>
      ))}
    </div>
  );
}
