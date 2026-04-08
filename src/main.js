// ── Helpers ────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }
  const data = {}
  match[1].split('\n').forEach(line => {
    const colon = line.indexOf(':')
    if (colon === -1) return
    const key = line.slice(0, colon).trim()
    const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '')
    data[key] = val
  })
  return { data, content: match[2] }
}

function setMeta(title, description) {
  document.title = title
  let desc = document.querySelector('meta[name="description"]')
  if (!desc) { desc = document.createElement('meta'); desc.name = 'description'; document.head.appendChild(desc) }
  desc.content = description
}

// ── Nav scroll effect ──────────────────────────────────────────
const nav = document.getElementById('nav')
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40)
}, { passive: true })

// ── Mobile burger ──────────────────────────────────────────────
const burger = document.getElementById('burger')
const mobileMenu = document.getElementById('mobileMenu')

burger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open')
  burger.setAttribute('aria-expanded', open)
  const spans = burger.querySelectorAll('span')
  if (open) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)'
    spans[1].style.opacity = '0'
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)'
  } else {
    spans[0].style.transform = ''
    spans[1].style.opacity = ''
    spans[2].style.transform = ''
  }
})

mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    mobileMenu.classList.remove('open')
    burger.setAttribute('aria-expanded', 'false')
    burger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = '' })
  })
})

// ── SPA Router ─────────────────────────────────────────────────
const mainSections = () => document.querySelectorAll('.main-section')
const articlesListPage = () => document.getElementById('articles-list-page')
const articleSinglePage = () => document.getElementById('article-single-page')

function showMain(hash) {
  mainSections().forEach(s => s.style.display = '')
  articlesListPage().style.display = 'none'
  articleSinglePage().style.display = 'none'
  nav.querySelectorAll('.main-nav-link').forEach(l => l.style.opacity = '')
  setMeta('Massaie Services | World-Class Concierge', 'Over a decade of VIP/VVIP concierge, medical tourism, and luxury transportation in Rochester, Minnesota.')
  if (hash) {
    setTimeout(() => {
      const el = document.querySelector(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  initReveal()
}

function showArticlesList() {
  mainSections().forEach(s => s.style.display = 'none')
  articlesListPage().style.display = 'block'
  articleSinglePage().style.display = 'none'
  setMeta('Articles & Guides | Massaie Services', 'Expert guidance on medical tourism, VIP travel, and concierge living in Rochester, Minnesota.')
  window.scrollTo({ top: 0 })
  loadArticlesList()
}

function showSingleArticle(slug) {
  mainSections().forEach(s => s.style.display = 'none')
  articlesListPage().style.display = 'none'
  articleSinglePage().style.display = 'block'
  window.scrollTo({ top: 0 })
  loadArticle(slug)
}

function route(path, push = true) {
  if (push) history.pushState({}, '', path)

  // Strip trailing slash, handle home
  const clean = path.replace(/\/$/, '') || '/'

  if (clean === '/articles') {
    showArticlesList()
  } else if (clean.startsWith('/articles/')) {
    const slug = clean.replace('/articles/', '')
    showSingleArticle(slug)
  } else if (clean === '/' || clean === '') {
    const hash = window.location.hash
    showMain(hash || null)
  } else if (clean.startsWith('/#') || window.location.hash) {
    showMain(window.location.hash)
  } else {
    showMain(null)
  }
}

// Handle all [data-spa] link clicks
document.addEventListener('click', e => {
  const link = e.target.closest('[data-spa]')
  if (!link) return
  e.preventDefault()
  const href = link.getAttribute('href')
  // If link is /#contact etc, go home first then scroll
  if (href.startsWith('/#')) {
    history.pushState({}, '', href)
    showMain(href.slice(1)) // pass #contact
  } else {
    route(href)
  }
})

// Browser back/forward
window.addEventListener('popstate', () => route(window.location.pathname, false))

// ── Article Loading ─────────────────────────────────────────────
let manifestCache = null

async function getManifest() {
  if (manifestCache) return manifestCache
  try {
    const res = await fetch('/content/articles-manifest.json')
    if (!res.ok) throw new Error('No manifest')
    manifestCache = await res.json()
  } catch {
    manifestCache = []
  }
  return manifestCache
}

async function loadArticlesList() {
  const grid = document.getElementById('articlesGrid')
  grid.innerHTML = '<div class="articles-loading">Loading articles…</div>'
  const articles = await getManifest()

  if (!articles.length) {
    grid.innerHTML = '<div class="articles-loading">No articles yet — check back soon.</div>'
    return
  }

  grid.innerHTML = articles.map(a => `
    <article class="article-card reveal" onclick="route('/articles/${a.slug}')">
      <div class="article-card__img">
        ${a.image
          ? `<img src="${a.image}" alt="${a.title}" loading="lazy" />`
          : `<span class="article-card__img-placeholder">${a.title.charAt(0)}</span>`}
      </div>
      <div class="article-card__body">
        <p class="article-card__date">${formatDate(a.date)}</p>
        <h2 class="article-card__title">${a.title}</h2>
        <p class="article-card__desc">${a.description}</p>
        <span class="article-card__link">
          Read Article
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
      </div>
    </article>
  `).join('')

  // Animate cards in
  grid.querySelectorAll('.article-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.08}s`
    setTimeout(() => card.classList.add('visible'), 50)
  })
}

async function loadArticle(slug) {
  const titleEl = document.getElementById('articleTitle')
  const metaEl = document.getElementById('articleMeta')
  const infoEl = document.getElementById('articleInfo')
  const contentEl = document.getElementById('articleContent')
  const relatedEl = document.getElementById('relatedArticles')

  titleEl.textContent = 'Loading…'
  contentEl.innerHTML = '<p style="color:var(--gray-400)">Loading article…</p>'

  try {
    const res = await fetch(`/content/articles/${slug}.md`)
    if (!res.ok) throw new Error('Not found')
    const raw = await res.text()
    const { data, content } = parseFrontmatter(raw)

    setMeta(
      `${data.title || slug} | Massaie Services`,
      data.description || 'Read this article from Massaie Services.'
    )

    metaEl.textContent = data.date ? formatDate(data.date) : ''
    titleEl.textContent = data.title || slug
    infoEl.innerHTML = `
      <span>By ${data.author || 'Massaie Services'}</span>
      ${data.readTime ? `<span>·</span><span>${data.readTime} min read</span>` : ''}
    `
    contentEl.innerHTML = marked.parse(content)

    // Related articles
    const manifest = await getManifest()
    const related = manifest.filter(a => a.slug !== slug).slice(0, 4)
    relatedEl.innerHTML = related.map(a => `
      <a class="related-link" href="/articles/${a.slug}" data-spa>${a.title}</a>
    `).join('')

  } catch {
    titleEl.textContent = 'Article not found'
    contentEl.innerHTML = `<p>Sorry, this article could not be loaded. <a href="/articles" data-spa>Browse all articles →</a></p>`
  }
}

// ── Scroll Reveal ───────────────────────────────────────────────
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })

  const targets = [
    '.service-card', '.about__text', '.about__visual',
    '.contact__info', '.contact__form', '.section-header', '.process__step'
  ]
  targets.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('reveal')
      el.style.transitionDelay = `${i * 0.07}s`
      observer.observe(el)
    })
  })
}

// ── Contact form ────────────────────────────────────────────────
const form = document.getElementById('contactForm')
form.addEventListener('submit', e => {
  e.preventDefault()
  const btn = form.querySelector('button[type="submit"]')
  const original = btn.textContent
  const data = Object.fromEntries(new FormData(form))
  const missing = ['firstName', 'lastName', 'email'].filter(k => !data[k]?.trim())
  if (missing.length) {
    missing.forEach(k => {
      const input = form.querySelector(`#${k}`)
      input.style.borderColor = '#ef4444'
      input.addEventListener('input', () => { input.style.borderColor = '' }, { once: true })
    })
    return
  }
  btn.textContent = 'Sending…'
  btn.disabled = true
  setTimeout(() => {
    btn.textContent = 'Message Sent!'
    btn.style.background = '#16a34a'
    btn.style.borderColor = '#16a34a'
    form.reset()
    setTimeout(() => {
      btn.textContent = original
      btn.style.background = ''
      btn.style.borderColor = ''
      btn.disabled = false
    }, 3500)
  }, 1200)
})

// ── Active nav highlight ────────────────────────────────────────
const sections = document.querySelectorAll('section[id]')
const navLinks = document.querySelectorAll('.nav__links a[href^="#"]')
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id
      navLinks.forEach(link => {
        link.style.color = link.getAttribute('href') === `#${id}` ? 'var(--white)' : ''
      })
    }
  })
}, { threshold: 0.4 })
sections.forEach(s => sectionObserver.observe(s))

// ── Init ────────────────────────────────────────────────────────
// Expose route globally so dynamically-injected onclick attributes can call it
console.log('[massaie] module init, route type:', typeof route)
window.route = route
console.log('[massaie] window.route set:', typeof window.route)

route(window.location.pathname, false)
