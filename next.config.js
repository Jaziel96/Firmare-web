// next.config.js
module.exports = {
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false }; // Evita errores con módulos no soportados en navegador
    return config;
  },
};
