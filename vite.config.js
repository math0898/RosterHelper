import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const wowauditProxy = {
  target: 'http://localhost:3001',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/wowaudit/, ''),
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/wowaudit': wowauditProxy,
    },
  },
  preview: {
    proxy: {
      '/api/wowaudit': wowauditProxy,
    },
  },
})
