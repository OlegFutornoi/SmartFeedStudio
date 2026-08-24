/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@smartfeed/shared'],
  output: 'standalone',
};

export default nextConfig;
