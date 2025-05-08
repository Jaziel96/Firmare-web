// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // Captura la entrada original ANTES de modificarla
    const originalEntry = config.entry;
    config.entry = async () => {
      const entries = await originalEntry();
      return {
        ...entries,
        './polyfills.js': './polyfills.js',
      };
    };

    return config;
  },
};