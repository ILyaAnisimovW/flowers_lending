import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/flowers_lending/', // проверьте точное имя репо!
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
})