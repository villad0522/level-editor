import fs from 'node:fs';
import path from "path";
import express from 'express';
import { ViteDevServer } from 'vite';

// Constants
const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5173
const base = path.join(process.env.BASE || '/', "./client/").replaceAll("\\", "/");

// Cached production assets
const templateHtml = isProduction
    ? await fs.promises.readFile('./dist/client/index.html', 'utf-8')
    : ''
const ssrManifest = isProduction
    ? await fs.promises.readFile('./dist/client/.vite/ssr-manifest.json', 'utf-8')
    : undefined

// Create http server
const app = express()

app.use(express.json());

// Add Vite or respective production middlewares
let vite: ViteDevServer | null;
if (!isProduction) {
    const { createServer } = await import('vite')
    vite = await createServer({
        server: { middlewareMode: true },
        appType: 'custom',
        base: base,
    })
    app.use(vite.middlewares)
} else {
    const compression = (await import('compression')).default
    const sirv = (await import('sirv')).default
    app.use(compression())
    app.use(base, sirv('../dist/client', { extensions: [] }))
}

app.post("/code", async (req, res) => {
    if (!vite) return;
    let saveCode;
    if (!isProduction) {
        saveCode = (await vite.ssrLoadModule('/server/entry-server.ts')).saveCode;
    } else {
        saveCode = (await import('../dist/server/entry-server.ts' ?? "")).saveCode;
    }
    await saveCode(req.body.layerId, req.body.functionInfos);
    res.send("保存しました");
});

// Serve HTML
app.use('/', async (req, res) => {
    if (!vite) return;
    if (req.method !== "GET") return;
    try {
        const url = req.originalUrl.replace(base, '')

        let template
        let render
        if (!isProduction) {
            // Always read fresh template in development
            template = await fs.promises.readFile('./src/client/index.html', 'utf-8')
            template = await vite.transformIndexHtml(url, template)
            render = (await vite.ssrLoadModule('/server/entry-server.ts')).render
        } else {
            template = templateHtml
            render = (await import('../dist/server/entry-server.ts' ?? "")).render
        }

        const rendered = await render(url, ssrManifest, req.query)

        const html = template
            .replace(`<!--app-head-->`, rendered.head ?? '')
            .replace(`<!--app-body-->`, rendered.body ?? '')

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