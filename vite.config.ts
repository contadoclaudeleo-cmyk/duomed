import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Pasta onde o app fica publicado. No computador é "/".
// No GitHub Pages é "/duomed/" (definido em .github/workflows/publicar.yml).
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  build: {
    // As questões (src/data) ficam num arquivo separado do código do app
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('/src/data/') && id.endsWith('.json') ? 'conteudo' : undefined),
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Guarda tudo no aparelho para o app abrir sem internet
      // O conteúdo passa de 2 MB (limite padrão), por isso o limite maior
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webp,woff2}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
      manifest: {
        name: 'DuoMed',
        short_name: 'DuoMed',
        description: 'Estude medicina em lições curtas, todos os dias.',
        lang: 'pt-BR',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#14B8A6',
        background_color: '#FAFAF9',
        icons: [
          { src: 'brand/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'brand/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // O app instalável (service worker) é gerado no "npm run build".
      // Para testar a instalação: npm run build e depois npm run preview.
    }),
  ],
})
