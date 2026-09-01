/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/biblioteca-amneris.firebasestorage.app/**",
      },
    ],
  },
  // Firebase Hosting sets Cross-Origin-Opener-Policy: same-origin by default,
  // which breaks Firebase Auth's signInWithPopup: the auth popup can't call
  // window.closed on its opener, so the flow hangs and no session is minted.
  // Relaxing to `same-origin-allow-popups` preserves isolation for normal
  // navigation while letting the popup communicate back.
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
