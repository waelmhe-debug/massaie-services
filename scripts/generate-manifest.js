#!/usr/bin/env node
/**
 * Generates public/content/articles-manifest.json from markdown frontmatter.
 * Run: node scripts/generate-manifest.js
 * Runs automatically as part of `npm run build` (prebuild hook).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const articlesDir = path.join(__dirname, '../public/content/articles')
const outputFile = path.join(__dirname, '../public/content/articles-manifest.json')

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const data = {}
  match[1].split('\n').forEach(line => {
    const colon = line.indexOf(':')
    if (colon === -1) return
    const key = line.slice(0, colon).trim()
    const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '')
    data[key] = val
  })
  return data
}

const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'))

const articles = files.map(file => {
  const raw = fs.readFileSync(path.join(articlesDir, file), 'utf-8')
  const data = parseFrontmatter(raw)
  return {
    slug:        file.replace('.md', ''),
    title:       data.title       || file.replace('.md', '').replace(/-/g, ' '),
    date:        data.date        || '',
    description: data.description || '',
    author:      data.author      || 'Massaie Services Team',
    readTime:    data.readTime    || '',
    image:       data.image       || '',
  }
})

// Sort newest first
articles.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))

fs.writeFileSync(outputFile, JSON.stringify(articles, null, 2))
console.log(`✓ Generated articles-manifest.json (${articles.length} articles)`)
