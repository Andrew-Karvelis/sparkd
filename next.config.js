/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      { protocol: 'https', hostname: '*' },
    ],
  },
  serverExternalPackages: ['sharp', '@imgly/background-removal-node', 'bcrypt', '@prisma/client'],
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('sharp', '@imgly/background-removal-node', 'bcrypt');
    }
    return config;
  },
}

module.exports = nextConfig