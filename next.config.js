/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      { protocol: 'https', hostname: '*' },
    ],
  },
  // Avoid bundling native modules like sharp/background-removal into client/edge
  // experimental: {
  //   serverComponentsExternalPackages: ['sharp', '@imgly/background-removal-node'],
  // },
  webpack: (config) => {
    // if (isServer) {
    //   // Ensure Node.js resolves these at runtime
    //   config.externals = config.externals || [];
    //   config.externals.push('sharp', '@imgly/background-removal-node');
    // }
    return config;
  },
}

module.exports = nextConfig
