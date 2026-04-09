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

// ── Contact form (2-step) ───────────────────────────────────────
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/maqlzzpk'

// Per-service follow-up question definitions
const SERVICE_QUESTIONS = {
  'Transportation & Airport': {
    label: 'Transportation & Airport Services',
    hasSubTypes: true,
    subTypes: [
      {
        label: 'Airport Pickup / Drop-off',
        fields: [
          { label: 'Airport', name: 'trans_airport', type: 'select', options: ['RST — Rochester International', 'Signature FBO Rochester (RST)', 'MSP — Minneapolis-Saint Paul', 'Signature FBO Minneapolis (MSP)'] },
          { label: 'Service Type', name: 'trans_type', type: 'select', options: ['Pickup', 'Drop-off', 'Meet & Assist'] },
          { label: 'No. of Passengers', name: 'trans_passengers', type: 'number' },
          { label: 'No. of Bags', name: 'trans_bags', type: 'number' },
          { label: 'Vehicle Preference', name: 'trans_vehicle', type: 'select', options: ['Sedan', 'SUV', 'Van', 'Wheelchair Accessible'] },
          { label: 'Date & Time', name: 'trans_datetime', type: 'datetime-local' },
        ]
      },
      {
        label: 'Daily Service (10 hrs/day)',
        fields: [
          { label: 'Number of Days', name: 'daily_days', type: 'number' },
          { label: 'Vehicle Preference', name: 'daily_vehicle', type: 'select', options: ['Sedan', 'SUV', 'Van', 'Wheelchair Accessible'] },
          { label: 'Start Date', name: 'daily_start', type: 'date' },
        ]
      },
      {
        label: 'Hourly Service (min. 2 hrs)',
        fields: [
          { label: 'Number of Hours', name: 'hourly_hrs', type: 'number' },
          { label: 'Vehicle Preference', name: 'hourly_vehicle', type: 'select', options: ['Sedan', 'SUV', 'Van', 'Wheelchair Accessible'] },
          { label: 'Start Date & Time', name: 'hourly_datetime', type: 'datetime-local' },
        ]
      },
      {
        label: 'Daily Hospital / Clinic Rides',
        fields: [
          { label: 'Pickup Date & Time', name: 'hosp_datetime', type: 'datetime-local' },
          { label: 'Pickup Address', name: 'hosp_from', type: 'text', placeholder: 'Hotel name or address' },
          { label: 'Drop-off Address', name: 'hosp_to', type: 'text', placeholder: 'Clinic or facility address' },
          { label: 'Vehicle Preference', name: 'hosp_vehicle', type: 'select', options: ['Sedan', 'SUV', 'Van', 'Wheelchair Accessible'] },
        ]
      },
    ]
  },
  'Lodging & Move-In Support': {
    label: 'Lodging & Move-In Support',
    fields: [
      { label: 'Arrival Date', name: 'lodge_arrival', type: 'date' },
      { label: 'Duration of Stay', name: 'lodge_duration', type: 'select', options: ['1–3 days', '4–7 days', '1–2 weeks', '3–4 weeks', '1–3 months', '3+ months'] },
      { label: 'Number of Guests', name: 'lodge_guests', type: 'number' },
      { label: 'Budget Range', name: 'lodge_budget', type: 'select', options: ['Economy ($100–150/night)', 'Standard ($150–250/night)', 'Luxury ($250–500/night)', 'Presidential ($500+/night)'] },
      { label: 'Special Requirements', name: 'lodge_notes', type: 'textarea', placeholder: 'Accessibility needs, floor preferences, facilities nearby…' },
    ]
  },
  'Daily Home-care Support': {
    label: 'Daily / Weekly Home-care Support',
    fields: [
      { label: 'Support Needed', name: 'care_type', type: 'checkgroup', options: ['Companion visits', 'Light housekeeping', 'Grocery & pharmacy runs', 'Laundry coordination'] },
      { label: 'Days Per Week', name: 'care_days', type: 'select', options: ['1–2 days/week', '3–4 days/week', 'Daily', 'As needed'] },
      { label: 'Duration of Stay', name: 'care_duration', type: 'select', options: ['Less than 1 week', '1–2 weeks', '3–4 weeks', '1–3 months', '3+ months'] },
    ]
  },
  'Meals & Dietary Support': {
    label: 'Meals & Dietary Support',
    fields: [
      { label: 'Dietary Requirements', name: 'meal_diet', type: 'checkgroup', options: ['Halal', 'Kosher', 'Vegetarian', 'Vegan', 'Gluten-free', 'Medical diet'] },
      { label: 'Number of People', name: 'meal_people', type: 'number' },
      { label: 'Meals Needed', name: 'meal_which', type: 'checkgroup', options: ['Breakfast', 'Lunch', 'Dinner'] },
      { label: 'Allergies or Specific Foods', name: 'meal_notes', type: 'textarea', placeholder: 'Describe allergies, cultural preferences, or specific foods…' },
    ]
  },
  'Family, Child & Pet Support': {
    label: 'Family, Child & Pet Support',
    fields: [
      { label: 'Support Needed', name: 'family_type', type: 'checkgroup', options: ['Childcare coordination', 'Child activity planning', 'Pet boarding', 'Pet walking'] },
      { label: 'Number of Children', name: 'family_children', type: 'number' },
      { label: 'Ages of Children', name: 'family_ages', type: 'text', placeholder: 'e.g. 3, 7, 12' },
      { label: 'Pet Details', name: 'family_pet', type: 'text', placeholder: 'Type and breed, e.g. Golden Retriever' },
    ]
  },
  'City Guide & Leisure': {
    label: 'City Guide & Leisure Planning',
    fields: [
      { label: 'Interests', name: 'leisure_interests', type: 'checkgroup', options: ['Dining & restaurants', 'Shopping', 'Nature & parks', 'Cultural venues', 'Prayer facilities', 'Sports & recreation'] },
      { label: 'Number of People', name: 'leisure_people', type: 'number' },
      { label: 'Additional Preferences', name: 'leisure_notes', type: 'textarea', placeholder: 'Mobility considerations, languages, specific interests…' },
    ]
  },
  'Paperwork & Travel Coordination': {
    label: 'Paperwork & Travel Coordination',
    fields: [
      { label: 'Assistance Needed', name: 'paper_type', type: 'checkgroup', options: ['Organizing medical papers', 'Printing & scanning', 'Airline date changes', 'Hotel date changes', 'Appointment scheduling', 'Daily schedule reminders'] },
      { label: 'Additional Notes', name: 'paper_notes', type: 'textarea', placeholder: 'Describe what you need help coordinating…' },
    ]
  },
  'International White-Glove': {
    label: 'International White-Glove Services',
    fields: [
      { label: 'Country of Origin', name: 'intl_country', type: 'text', placeholder: 'e.g. Saudi Arabia, UAE, Kuwait…' },
      { label: 'Services Needed', name: 'intl_type', type: 'checkgroup', options: ['Pre-arrival WhatsApp/email planning', 'Airport meet-and-greet', 'SIM card & phone setup', 'Currency exchange assistance', 'US banking guidance', 'Language support', 'Cultural & religious support'] },
      { label: 'Languages Spoken', name: 'intl_lang', type: 'text', placeholder: 'e.g. Arabic, English, French…' },
      { label: 'Religious / Cultural Requirements', name: 'intl_religion', type: 'text', placeholder: 'e.g. Halal food, prayer times, dress code…' },
    ]
  },
}

function buildField(field) {
  const wrap = `<div class="form-group">`
  const label = `<label>${field.label}</label>`
  let input = ''
  if (field.type === 'select') {
    input = `<select name="${field.name}"><option value="">Select…</option>${field.options.map(o => `<option>${o}</option>`).join('')}</select>`
  } else if (field.type === 'textarea') {
    input = `<textarea name="${field.name}" rows="3" placeholder="${field.placeholder || ''}"></textarea>`
  } else if (field.type === 'checkgroup') {
    input = `<div class="checkgroup">${field.options.map(o => `<label class="checkgroup-item"><input type="checkbox" name="${field.name}[]" value="${o}"><span>${o}</span></label>`).join('')}</div>`
  } else {
    input = `<input type="${field.type}" name="${field.name}" placeholder="${field.placeholder || ''}" />`
  }
  return wrap + label + input + `</div>`
}

function buildStep2Form(selectedServices, clientName) {
  const container = document.getElementById('contactStep2')

  const sections = selectedServices.map(svcName => {
    const svc = SERVICE_QUESTIONS[svcName]
    if (!svc) return ''

    if (svc.hasSubTypes) {
      const tabs = svc.subTypes.map((st, i) =>
        `<button type="button" class="step2-subtype-btn${i === 0 ? ' active' : ''}" data-subtype="${i}">${st.label}</button>`
      ).join('')

      const panels = svc.subTypes.map((st, i) =>
        `<div class="step2-subfields${i === 0 ? ' active' : ''}" data-panel="${i}">${st.fields.map(buildField).join('')}</div>`
      ).join('')

      return `<div class="step2-section">
        <div class="step2-section-title">${svc.label}</div>
        <div class="step2-subtypes">${tabs}</div>
        ${panels}
      </div>`
    }

    return `<div class="step2-section">
      <div class="step2-section-title">${svc.label}</div>
      ${svc.fields.map(buildField).join('')}
    </div>`
  }).join('')

  container.innerHTML = `
    <form class="step2-form" id="step2Form">
      <h3>Message sent — one more step</h3>
      <p>To prepare your quote, we just need a bit more information about the services you selected.</p>
      <input type="hidden" name="_subject" value="Follow-up details from ${clientName}" />
      ${sections}
      <div style="margin-top:28px; display:flex; gap:12px; flex-wrap:wrap;">
        <button type="submit" class="btn btn--primary">Submit Details</button>
        <button type="button" class="btn btn--ghost" id="skipStep2">Skip for Now</button>
      </div>
      <p class="form-note" style="margin-top:14px">This is optional — we'll follow up by email with any missing information.</p>
    </form>
  `

  // Sub-type tab switching (for Transportation)
  container.querySelectorAll('.step2-subtype-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.closest('.step2-section')
      const idx = btn.dataset.subtype
      section.querySelectorAll('.step2-subtype-btn').forEach(b => b.classList.remove('active'))
      section.querySelectorAll('.step2-subfields').forEach(p => p.classList.remove('active'))
      btn.classList.add('active')
      section.querySelector(`.step2-subfields[data-panel="${idx}"]`).classList.add('active')
    })
  })

  document.getElementById('skipStep2').addEventListener('click', () => {
    container.innerHTML = `<div class="step2-submitted"><h3>All Set</h3><p>We received your message and will be in touch shortly.</p></div>`
  })

  document.getElementById('step2Form').addEventListener('submit', async e => {
    e.preventDefault()
    const btn = e.target.querySelector('[type="submit"]')
    btn.textContent = 'Sending…'
    btn.disabled = true
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(e.target)
      })
      if (!res.ok) throw new Error()
    } catch { /* fail silently — main form already sent */ }
    container.innerHTML = `<div class="step2-submitted"><h3>Details Received</h3><p>Thank you — we'll prepare your quote and be in touch soon.</p></div>`
  })

  container.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const form = document.getElementById('contactForm')
form.addEventListener('submit', async e => {
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

  // Collect selected services
  const selectedServices = [...form.querySelectorAll('input[name="services"]:checked')].map(cb => cb.value)

  btn.textContent = 'Sending…'
  btn.disabled = true

  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    })
    if (!res.ok) throw new Error('Server error')
  } catch {
    btn.textContent = 'Failed — please email us directly'
    btn.style.background = '#ef4444'
    btn.style.borderColor = '#ef4444'
    setTimeout(() => {
      btn.textContent = original
      btn.style.background = ''
      btn.style.borderColor = ''
      btn.disabled = false
    }, 4000)
    return
  }

  btn.textContent = 'Sent!'
  btn.style.background = '#16a34a'
  btn.style.borderColor = '#16a34a'
  form.reset()

  const clientName = `${data.firstName} ${data.lastName}`
  if (selectedServices.length) {
    buildStep2Form(selectedServices, clientName)
  }

  setTimeout(() => {
    btn.textContent = original
    btn.style.background = ''
    btn.style.borderColor = ''
    btn.disabled = false
  }, 3500)
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
