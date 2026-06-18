import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'app')
const srcDir = join(appDir, '..')

async function filesUnder(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(entries
    .filter(entry => entry.name !== '_backups')
    .map(entry => entry.isDirectory() ? filesUnder(join(dir, entry.name)) : join(dir, entry.name)))
  return nested.flat()
}

function routeForPage(file) {
  const folder = relative(appDir, dirname(file)).split(sep).filter(segment => !/^\(.+\)$/.test(segment))
  return `/${folder.join('/')}`.replace(/\/$/, '') || '/'
}

function normalizeHref(href) {
  return href.replace(/\$\{[^}]+\}/g, '[id]').replace(/\/$/, '') || '/'
}

const files = await filesUnder(srcDir)
const sourceFiles = files.filter(file => /\.(?:ts|tsx)$/.test(file))
const routes = new Set(sourceFiles.filter(file => file.endsWith(`${sep}page.tsx`)).map(routeForPage))
const references = []

for (const file of sourceFiles) {
  const source = await readFile(file, 'utf8')
  for (const match of source.matchAll(/href\s*=\s*(?:"([^"]+)"|\{`([^`]+)`\})/g)) {
    const href = match[1] ?? match[2]
    if (href.startsWith('/')) references.push({ file, href: normalizeHref(href) })
  }
  for (const match of source.matchAll(/\{\s*href:\s*'([^']+)'/g)) {
    if (match[1].startsWith('/')) references.push({ file, href: normalizeHref(match[1]) })
  }
}

const broken = references.filter(reference => !routes.has(reference.href))
const proxySource = await readFile(join(srcDir, 'proxy.ts'), 'utf8')
const missingPublicPaths = ['/', '/login', '/privacy'].filter(path => !proxySource.includes(`'${path}'`))

if (broken.length || missingPublicPaths.length) {
  for (const item of broken) {
    console.error(`[BROKEN] ${relative(srcDir, item.file)} -> ${item.href}`)
  }
  for (const path of missingPublicPaths) console.error(`[BROKEN] public route ${path} is missing from proxy allowlist`)
  process.exitCode = 1
} else {
  console.log(`Route link check passed: ${references.length} internal links resolve across ${routes.size} routes; public routes bypass authentication.`)
}
