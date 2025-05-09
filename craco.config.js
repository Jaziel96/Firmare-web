// craco.config.js
const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@/components': path.resolve(__dirname, 'components'),
      '@/lib': path.resolve(__dirname, 'lib')
    }
  }
};