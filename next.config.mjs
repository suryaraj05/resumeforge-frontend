/** @type {import('next').NextConfig} */
const backendBase = (
  process.env.API_URL ||
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:4000"
)
  .trim()
  .replace(/\/$/, "");

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  async rewrites() {
    return [
      { source: "/favicon.ico", destination: "/icon.svg" },
      // Browser calls same-origin /api/*; Vercel proxies to Railway so clients never resolve *.railway.app.
      { source: "/api/:path*", destination: `${backendBase}/api/:path*` },
    ];
  },
  // Firebase Auth popup + Google OAuth need the opener to read window.closed; strict COOP breaks that.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
