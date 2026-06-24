const webpack = require('webpack');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Telegram/WhatsApp/etc. need OG tags in <head>, not streamed into <body>
  htmlLimitedBots:
    /TelegramBot|Twitterbot|facebookexternalhit|LinkedInBot|Slackbot|Discordbot|WhatsApp|bingbot|Googlebot|Applebot|Pinterest|Embedly|preview/i,
  experimental: {
    optimizePackageImports: ['react-icons', 'lucide-react'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: false,
  async redirects() {
    return [
      { source: '/games', destination: '/game', permanent: true },
      { source: '/volume-cup', destination: '/competition', permanent: true },
      {
        source: '/Lucas Advisor.JPG',
        destination: '/lucas-advisor.jpg',
        permanent: true,
      },
      {
        source: '/Lucas%20Advisor.JPG',
        destination: '/lucas-advisor.jpg',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer, dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^pino-pretty$/,
      }),
    );

    if (!isServer && !dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        maxSize: 200000,
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@react|react|next|scheduler)[\\/]/,
            priority: 40,
            enforce: true,
          },
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            priority: 20,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              if (module.context && module.context.match) {
                const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                if (match && match[1]) {
                  return `npm.${match[1].replace('@', '')}`;
                }
              }
              return 'npm.unknown';
            },
            priority: 10,
            minChunks: 1,
          },
        },
      };
    }

    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
