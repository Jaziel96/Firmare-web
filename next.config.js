// next.config.js
const path = require('path');

module.exports = {
  webpack: (config, { isServer }) => {
    // Configuración de alias para rutas absolutas
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': path.resolve(__dirname, 'components'),
      '@/lib': path.resolve(__dirname, 'lib'),
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    const originalEntry = config.entry;
    config.entry = async () => ({
      ...(await originalEntry()),
      './polyfills.js': './polyfills.js',
    });

    return config;
  },
};