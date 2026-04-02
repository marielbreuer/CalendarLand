"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import PasswordInput from "./PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHasError(false);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setHasError(true);
    } else {
      router.push("/calendar");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background:
          "var(--grad-hero, linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%))",
      }}
    >
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold mb-1"
            style={{
              fontFamily: "'Poppins', sans-serif",
              color: "var(--pink, #ec4899)",
            }}
          >
            Calendar Land
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--text-secondary, #6b7280)" }}
          >
            Sign in to your account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border shadow-xl p-6 space-y-4"
          style={{
            background: "var(--bg-primary, #fff)",
            borderColor: "var(--border-primary, #e5e7eb)",
          }}
        >
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--text-primary, #111827)" }}
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              autoFocus
              required
              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
              style={{
                borderColor: hasError ? "#ef4444" : "var(--border-primary, #e5e7eb)",
                background: "var(--bg-secondary, #f9fafb)",
                color: "var(--text-primary, #111827)",
              }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--text-primary, #111827)" }}
            >
              Password
            </label>
            <PasswordInput hasError={hasError} />
            {hasError && (
              <p className="mt-1.5 text-xs text-red-500">
                Incorrect email or password.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60"
            style={{ background: "var(--pink, #ec4899)", color: "#fff" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
