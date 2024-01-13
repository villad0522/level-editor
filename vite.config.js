// vite.config.js
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    root: path.resolve(__dirname, 'src'),
    publicDir: "../public/",
    resolve: {
        alias: {
            '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
        }
    },
    build: {
        outDir: '../dist',
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'src/server.ts'),
                //nested: resolve(__dirname, 'nested/index.html'),
            },
        },
    },
})
