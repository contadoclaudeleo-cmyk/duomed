import { createHash } from 'node:crypto'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Pasta onde o app fica publicado. No computador é "/".
// No GitHub Pages é "/duomed/" (definido em .github/workflows/publicar.yml).
const base = process.env.BASE_PATH ?? '/'

/**
 * Segurança: Content Security Policy (CSP), uma lista do que a página pode carregar.
 * Se alguém conseguir injetar um script estranho, o navegador bloqueia.
 * Só entra na versão publicada (no computador o Vite precisa de scripts próprios).
 * O script do tema, que fica dentro do index.html, é liberado pelo hash dele.
 */
function politicaDeSeguranca(): Plugin {
  return {
    name: 'duomed-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
          ([, codigo]) => `'sha256-${createHash('sha256').update(codigo).digest('base64')}'`,
        )
        const supabase = 'https://dkdizfpywyvpxhfpiivr.supabase.co'
        // CAPTCHA do Cloudflare: só é liberado quando a chave existe (ver components/Captcha.tsx)
        const captcha = loadEnv('production', process.cwd(), 'VITE_').VITE_TURNSTILE_SITEKEY ? ' https://challenges.cloudflare.com' : ''
        const regras = [
          "default-src 'self'",
          `script-src 'self' ${hashes.join(' ')}${captcha}`,
          ...(captcha ? [`frame-src${captcha}`] : []),
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          "media-src 'self' data: blob:",
          `connect-src 'self' ${supabase}`,
          "worker-src 'self'",
          "manifest-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ')
        return html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${regras}" />`)
      },
    },
  }
}

export default defineConfig({
  base,
  // As questões não entram no site: ficam no Supabase (ver src/lib/estudo.ts).
  // Aqui só vai a estrutura (src/data/estrutura.json), com os ids.
  build: { chunkSizeWarningLimit: 1500 },
  plugins: [
    react(),
    tailwindcss(),
    politicaDeSeguranca(),
    VitePWA({
      registerType: 'autoUpdate',
      // Guarda tudo no aparelho para o app abrir sem internet
      // O conteúdo passa de 2 MB (limite padrão), por isso o limite maior
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webp,woff2,mp3}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
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
