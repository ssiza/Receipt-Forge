import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    clientSegmentCache: true,
    nodeMiddleware: true
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-only modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        perf_hooks: false,
        os: false,
      };
    }
    return config;
  },
};

export default nextConfig;
