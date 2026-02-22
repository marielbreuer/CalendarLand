"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm" style={{ color: "var(--text-secondary, #6b7280)" }}>
          Invalid or missing invite link.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Registration failed");
        setLoading(false);
        return;
      }

      // Auto-sign-in after successful registration
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push("/calendar");
      } else {
        router.push("/login");
      }
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  }

  return (
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
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoFocus
          required
          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
          style={{
            borderColor: "var(--border-primary, #e5e7eb)",
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
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
          style={{
            borderColor: "var(--border-primary, #e5e7eb)",
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
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
          minLength={8}
          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
          style={{
            borderColor: error ? "#ef4444" : "var(--border-primary, #e5e7eb)",
            background: "var(--bg-secondary, #f9fafb)",
            color: "var(--text-primary, #111827)",
          }}
        />
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60"
        style={{ background: "var(--pink, #ec4899)", color: "#fff" }}
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}

export default function RegisterPage() {
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
            Create your account
          </p>
        </div>

        <Suspense fallback={<div className="text-center text-sm">Loading...</div>}>
          <RegisterForm />
        </Suspense>

        <p className="text-center text-xs mt-4" style={{ color: "var(--text-secondary, #6b7280)" }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "var(--pink, #ec4899)" }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
