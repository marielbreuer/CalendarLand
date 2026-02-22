import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const hasError = !!params?.error;

  async function loginAction(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/calendar",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect("/login?error=1");
      }
      // NEXT_REDIRECT must be rethrown
      throw err;
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
          action={loginAction}
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
                borderColor: hasError
                  ? "#ef4444"
                  : "var(--border-primary, #e5e7eb)",
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
              name="password"
              placeholder="Password"
              required
              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
              style={{
                borderColor: hasError
                  ? "#ef4444"
                  : "var(--border-primary, #e5e7eb)",
                background: "var(--bg-secondary, #f9fafb)",
                color: "var(--text-primary, #111827)",
              }}
            />
            {hasError && (
              <p className="mt-1.5 text-xs text-red-500">
                Incorrect email or password.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-opacity"
            style={{ background: "var(--pink, #ec4899)", color: "#fff" }}
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
