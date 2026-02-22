export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const ping = async () => {
    try { await fetch(`${baseUrl}/api/health`); } catch { /* ignore */ }
  };

  // Wait 10s for server to fully start, then ping every 30s
  setTimeout(() => { ping(); setInterval(ping, 30_000); }, 10_000);
}
