// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, './src/client/index.html'),
                //nested: resolve(__dirname, 'nested/index.html'),
            },
        },
    },
})
