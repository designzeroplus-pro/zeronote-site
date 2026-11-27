import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import MarkdownIt from 'markdown-it'

const output = new URL('../dist/', import.meta.url)
const releaseApi = 'https://api.github.com/repos/designzeroplus-pro/zeronote-site/releases'
const pageSize = 100
const releases = []

for (let page = 1; ; page += 1) {
  const response = await fetch(`${releaseApi}?per_page=${pageSize}&page=${page}`, {
    headers: { Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(15_000)
  })
  if (!response.ok) throw new Error(`GitHub Releases returned HTTP ${response.status}`)
  const batch = await response.json()
  releases.push(...batch)
  if (batch.length < pageSize) break
}

const changelog = await readFile(new URL('../changelog.html', import.meta.url), 'utf8')
const marker = '<!-- published releases -->'
if (!changelog.includes(marker)) throw new Error('Missing release archive insertion point')

const markdown = new MarkdownIt('commonmark', { html: false })
const dateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
})
const articles = []
releases.sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))
for (const release of releases) {
  const tag = release.tag_name
  if (release.draft || release.prerelease || !release.published_at || !/^v\d+\.\d+\.\d+$/.test(tag)) continue
  if (changelog.includes(`id="${tag}"`)) continue
  const date = dateFormat.format(new Date(release.published_at))
  const title = release.name || tag
  const lines = (release.body ?? '').trim().split('\n')
  if (lines[0].replace(/^[# ]+/, '').trim() === title) lines.shift()
  articles.push(`    <article id="${tag}" class="note-entry">
      <header><a href="#${tag}">${tag}</a><time datetime="${date}">${date.replaceAll('-', '. ')}.</time></header>
      <div><h2>${markdown.utils.escapeHtml(title)}</h2>${markdown.render(lines.join('\n'))}</div>
    </article>`)
}

await rm(output, { recursive: true, force: true })
await mkdir(output)
const publicFiles = ['index.html', 'download.html', 'privacy.html', 'robots.txt', 'sitemap.xml', 'llms.txt', 'assets']
await Promise.all(publicFiles.map(name => cp(new URL(`../${name}`, import.meta.url), new URL(name, output), { recursive: true })))
await writeFile(new URL('changelog.html', output), changelog.replace(marker, `${marker}\n${articles.join('\n')}`))
