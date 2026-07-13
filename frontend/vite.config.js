import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-public-index',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/' || req.url === '/index.html') {
            try {
              const htmlPath = resolve(__dirname, 'public/index.html')
              const html = fs.readFileSync(htmlPath, 'utf-8')
              server.transformIndexHtml(req.url, html)
                .then((transformedHtml) => {
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'text/html')
                  res.end(transformedHtml)
                })
                .catch(next)
            } catch (err) {
              next(err)
            }
          } else {
            next()
          }
        })
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  css: {
    postcss: './postcss.config.js',
  },
})
