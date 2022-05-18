import { defineConfig } from 'vite'
import eslintPlugin from 'vite-plugin-eslint'

export default defineConfig({
  plugins: [eslintPlugin({cache: false})],
  build: {
    outDir: "dist/client"
  }
})
