# davejoem.github.io — Modernization Workplan

## Context

`davejoem.github.io` is Dave's personal portfolio, built in ~2017 from the
"Howdy" (StyleShout) template. It ships jQuery, IE8-era CSS, placeholder
template content (fake jobs, fake portfolio projects, fake stats), a dead
Heroku contact-form endpoint, a non-functional `sendEmail.php`, and a broken
`cv.pdf` link. Last real commit: 2024-09-25 (metadata only).

## Confirmed direction (from Q&A with Dave)

- **Identity**: Personal portfolio positioned as *Founder of Infiforge, a
  Kenyan software and technology solutions company* (no SaaS mention in hero).
- **Tech**: Clean static HTML/CSS/JS, no framework, GitHub Pages native, no
  build step. Remove jQuery + vendor CSS/JS.
- **Contact**: Drop the form (dead Heroku + PHP can't run on Pages). Prominent
  email/WhatsApp/social links. Add GitHub + LinkedIn.
- **Content**: Replace all template filler with real info:
  - Portfolio = real Infiforge services with live links.
  - Experience = simplified real timeline (Founder & Full-Stack Developer).
  - Skills/stats = keep existing values (stated as real), add current-stack
    items and feature those.
- **Design**: Full modern redesign, dark/light theme, responsive, animations.

## Design system

- **Aesthetic**: "Editorial developer-founder". Deep warm-ink charcoal (dark)
  + warm paper (light). Hairline borders, subtle grain, restrained motion.
- **Type**: Libre Baskerville (serif display) + Montserrat (UI/body) — both
  already self-hosted in the repo — + system monospace for small labels.
- **Accent**: Savanna gold/amber. One accent, used sparingly.
- **Motion**: IntersectionObserver reveals, counter animation, smooth scroll,
  theme toggle persisted in `localStorage` with `prefers-color-scheme` default.

## Structure (single page, `index.html`)

1. Sticky nav — monogram, section links, theme toggle, "Hire me" CTA
2. Hero — headline, founder statement, CTAs, social row, visual motif
3. About — short bio + "What I do" cards (engineering, products, design)
4. Skills — grouped pill tags: current stack featured, original skills under
   "also experienced with"
5. Portfolio — grid of real Infiforge services → live funnel URLs
6. Experience — simplified timeline (Infiforge chapters)
7. Stats — original counters + new real ones (12+ products), new ones accent
8. Contact — no form: email chips, WhatsApp, phone, location, social grid
9. Footer — auto-year copyright, back-to-top

## Assets

- `favicon.svg` (monogram) — new; keep `favicon.ico` fallback reference.
- `og-image` — generate PNG with the monogram + wordmark on dark ink.
- Reuse `assets/fonts/{montserrat,librebaskerville}/**/*.woff2`.
- Drop unused template assets (stock photos, vendor css/js, php, styles.html,
  remaining fonts) at the end.

## Files

- `index.html` — full page
- `assets/css/style.css` — single stylesheet (tokens + layout + themes)
- `assets/js/main.js` — nav, theme, reveals, counters, scroll
- `workplan.md` — this file

## Verification

- Serve locally and check at mobile/tablet/desktop widths.
- Confirm nav anchors, form-free contact, theme toggle, counter animation.
- Confirm `git status` clean after removing unused files.

## Open items to confirm with Dave

- LinkedIn URL (using `https://www.linkedin.com/in/davejoem` as default).
- Live service links point to the Tailscale funnel host; swap for public
  domains when available.
- Primary public email(s) to feature (currently `davejoem@live.com` /
  `davejoeem@gmail.com` / company `dev@infiforge.tech`).