// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    // Excluir módulos de Node.js en el cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
        crypto: false,
      };
      
      // 👇 Añade esto para bloquear completamente canvas
      config.externals = {
        ...config.externals,
        canvas: "commonjs canvas"
      };
    }

    // Polyfill para Promise.withResolvers
    const originalEntry = config.entry;
    config.entry = async () => ({
      ...(await originalEntry()),
      './polyfills.js': './polyfills.js',
    });

    return config;
  },
};