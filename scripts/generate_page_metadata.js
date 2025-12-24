#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir)
  files.forEach((file) => {
    const p = path.join(dir, file)
    const stat = fs.statSync(p)
    if (stat.isDirectory()) walk(p, filelist)
    else filelist.push(p)
  })
  return filelist
}

function extractMetadata(content) {
  // Try to find explicit `export const metadata = { title: '...', description: '...' }`
  const metaRe = /export\s+const\s+metadata\s*=\s*\{([\s\S]*?)\}\s*/m
  const m = content.match(metaRe)
  if (m) {
    const body = m[1]
    const title = (body.match(/title\s*:\s*['`\"]([\s\S]*?)['`\"]/m) || [])[1]
    const description = (body.match(/description\s*:\s*['`\"]([\s\S]*?)['`\"]/m) || [])[1]
    if (title || description) return { title: title && title.trim(), description: description && description.trim() }
  }

  // Fallback: find first <h1> and first <p>
  const h1 = (content.match(/<h1[^>]*>([^<]+)<\/h1>/i) || [])[1]
  const p = (content.match(/<p[^>]*>([^<]+)<\/p>/i) || [])[1]
  if (h1 || p) return { title: h1 && h1.trim(), description: p && p.trim() }

  return null
}

function keyFromPath(file) {
  const rel = path.relative(path.join(process.cwd(), 'app'), file)
  const parts = rel.split(path.sep)
  // remove page.tsx or page.jsx
  if (parts[parts.length - 1] && parts[parts.length - 1].startsWith('page.')) parts.pop()
  if (parts.length === 0) return 'home'
  return parts.join('/')
}

function generate() {
  const appDir = path.join(process.cwd(), 'app')
  if (!fs.existsSync(appDir)) {
    console.error('No app/ directory found')
    process.exit(1)
  }

  const files = walk(appDir).filter((f) => /page\.(tsx|jsx|ts|js)$/.test(f))
  const entries = {}
  files.forEach((f) => {
    try {
      const content = fs.readFileSync(f, 'utf8')
      const meta = extractMetadata(content) || {}
      const key = keyFromPath(f)
      entries[key] = {
        title: meta.title || guessTitleFromKey(key),
        description: meta.description || guessDescriptionFromKey(key),
      }
    } catch (e) {
      // ignore
    }
  })

  const out = generateFile(entries)
  const outPath = path.join(process.cwd(), 'lib', 'pageMetadata.ts')
  fs.writeFileSync(outPath, out, 'utf8')
  console.log('Wrote', outPath)
}

function guessTitleFromKey(k) {
  const parts = k.split('/')
  const last = parts[parts.length - 1]
  return (last === 'home') ? 'Civic Opposition of India' : toTitleCase(last.replace(/-/g,' '))
}

function guessDescriptionFromKey(k) {
  if (k === 'home') return 'Building a transparent, accountable democracy through collective civic action.'
  return `Learn more about ${toTitleCase(k.replace(/\//g, ' › '))} on Civic Opposition of India.`
}

function toTitleCase(s) {
  return s.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1))
}

function generateFile(entries) {
  const header = `export type PageMeta = {\n  title: string\n  description: string\n}\n\nconst pageMetadata: Record<string, PageMeta> = `
  const body = JSON.stringify(entries, null, 2)
  return header + body + '\n\nexport function getMetadata(key: string): PageMeta {\n  return pageMetadata[key] || {\n    title: "Civic Opposition of India",\n    description: "Building a transparent, accountable democracy through collective civic action.",\n  }\n}\n\nexport default pageMetadata\n'
}

generate()
