// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback, // Mantén los fallbacks existentes
      fs: false,
      path: false,
      crypto: false,
      canvas: false // 👈 Nuevo fallback agregado
    };

    // Opcional: Ignora advertencias de dependencias opcionales
    config.ignoreWarnings = [
      { module: /node_modules\/pdfjs-dist/ },
      { module: /node_modules\/canvas/ }
    ];

    return config;
  },
};