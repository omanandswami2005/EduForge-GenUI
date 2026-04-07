import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    experimental: {
        serverActions: {
            allowedOrigins: [
                "localhost:3000",
                process.env.NEXT_PUBLIC_APP_URL || "",
            ],
        },
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "storage.googleapis.com",
            },
        ],
    },
};

export default nextConfig;
