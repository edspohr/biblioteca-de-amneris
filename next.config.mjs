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
};

export default nextConfig;
