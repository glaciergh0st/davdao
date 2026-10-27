# David Awosusi — Security Engineering Portfolio

A dependency-free static site with content served from same-origin JSON endpoints. The portfolio is aimed at security engineering hiring teams and technical peers.

## Structure

- `src/index.html` — semantic home page template.
- `src/assets/styles.css` — responsive styles; no remote fonts or assets.
- `src/content/locales/en-US/site.json` — site copy, navigation, experience, credentials, tool groups, and contact details.
- `src/content/locales/en-US/projects.json` — project cards and write-up metadata.
- `src/content/locales/en-US/projects/*.md` — localized project write-ups.
- `src/assets/content.js` — fetches and validates public content at runtime, then renders it with DOM APIs.
- `src/templates/project.html` — shared write-up page template.
- `scripts/build.mjs` — dependency-free generator with schema-like validation and safe Markdown rendering.
- `public/_headers` — CSP and HTTP security headers for static hosting.
- `public/robots.txt` — crawler preferences, including AI training crawlers.

## Content workflow

Edit the locale JSON and Markdown files under `src/content/locales/<locale>/`. The build validates required fields and produces a static fallback. At runtime, the page fetches `/content/site.json` and `/content/projects.json` from the same origin and updates every content section and project write-up. If either endpoint is unavailable or invalid, the pre-rendered page remains usable. Layout and content remain separate, so copy changes do not require editing HTML.

To add a language or regional variant, add a matching locale folder with `site.json`, `projects.json`, and translated project write-ups, then build with `PUBLIC_SITE_LOCALE=<locale>`. The runtime API contract is versioned with `schemaVersion` and `locale`; projects are returned as an `items` collection with stable slugs, page URLs, and Markdown. A headless CMS or backend can serve the same same-origin paths without changing the front end. The current deployment serves generated JSON files; no CMS or editing API is connected yet. Keep secrets out of these public content files.

## Build

Requires Node.js 20 or later. No package installation is needed.

```sh
npm run build
```

The build removes and recreates `dist/`, then generates the home page and one HTML page for every Markdown write-up.

Optional build-time settings are documented in `.env.example`. They are public values embedded in the generated HTML or content JSON. Do not place API tokens, credentials, or secrets in this static project.

## Security notes

- The site has no visitor input fields, contact form, analytics, third-party scripts, cookies, or external runtime dependencies. Contact uses a `mailto:` link.
- The site has no visitor input fields. Runtime JSON is structurally checked; values are written with `textContent` and DOM creation methods. Markdown supports a small set of elements, ignores raw HTML, and only creates links for HTTPS URLs. No runtime content is assigned through `innerHTML`.
- The CSP is delivered through `public/_headers`. The matching meta policy is defense in depth. `frame-ancestors` and `X-Frame-Options` must be delivered as HTTP headers; browsers do not enforce `frame-ancestors` from a meta tag.
- The CSP retains the requested `style-src 'self' 'unsafe-inline'` directive. Site styles are external, so inline style attributes are not used.
- `robots.txt` asks named crawlers not to access the site. Robots rules are voluntary and do not prevent a crawler that ignores them.
- External links open in a new tab only with `rel="noopener noreferrer"`.

## Content accuracy

Engagement details are anonymized. The PID telemetry work is labeled as in progress. Certification status and dates reflect the available profile information; verify them against current credential records before making the site public.
