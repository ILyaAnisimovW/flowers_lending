import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ command }) => ({
  // base применяется только при сборке (npm run build) под GitHub Pages;
  // в dev-режиме (npm run dev) сайт остаётся в корне, и /images/... работает
  base: command === 'build' ? '/flowers_lending/' : '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        catalog: resolve(__dirname, 'catalog.html'),
        checkout: resolve(__dirname, 'checkout.html'),
        reviews: resolve(__dirname, 'reviews.html'),
      }
    }
  }
})) 