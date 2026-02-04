/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      { source: '/warm-start', destination: '/api/warm-start' },
      { source: '/connect', destination: '/api/connect' },
      { source: '/health', destination: '/api/health' },
    ];
  },
};

module.exports = nextConfig;
