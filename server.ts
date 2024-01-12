import fs from 'node:fs/promises';
import express from 'express';
import { ViteDevServer } from 'vite';

// Constants
const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5173
const base = process.env.BASE || '/'

// Cached production assets
const templateHtml = isProduction
    ? await fs.readFile('./dist/client/index.html', 'utf-8')
    : ''
const ssrManifest = isProduction
    ? await fs.readFile('./dist/client/.vite/ssr-manifest.json', 'utf-8')
    : undefined

// Create http server
const app = express()

// Add Vite or respective production middlewares
let vite: ViteDevServer | null;
if (!isProduction) {
    const { createServer } = await import('vite')
    vite = await createServer({
        server: { middlewareMode: true },
        appType: 'custom',
        base
    })
    app.use(vite.middlewares)
} else {
    const compression = (await import('compression')).default
    const sirv = (await import('sirv')).default
    app.use(compression())
    app.use(base, sirv('./dist/client', { extensions: [] }))
}

// Serve HTML
app.use('*', async (req, res) => {
    if (!vite) return;
    try {
        const url = req.originalUrl.replace(base, '')

        let template
        let render
        if (!isProduction) {
            // Always read fresh template in development
            template = await fs.readFile('./src/client/index.html', 'utf-8')
            template = await vite.transformIndexHtml(url, template)
            render = (await vite.ssrLoadModule('/src/server/entry-server.ts')).render
        } else {
            template = templateHtml
            render = (await import('./dist/server/entry-server.ts' ?? "")).render
        }

        const rendered = await render(url, ssrManifest)

        const html = template
            .replace(`<!--app-head-->`, rendered.head ?? '')
            .replace(`<!--app-header-->`, rendered.header ?? '')
            .replace(`<!--app-sidebar-->`, rendered.sidebar ?? '')
            .replace(`<!--app-main-->`, rendered.main ?? '')

        res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (error) {
        const e = error as Error;
        vite?.ssrFixStacktrace(e)
        console.log(e.stack)
        res.status(500).end(e.stack)
    }
})

// Start http server
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`)
})