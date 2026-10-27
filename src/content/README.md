# Site content

The site reads its content from versioned JSON and Markdown files. The build emits the public, same-origin feeds under `/content/` and static HTML pages for search engines and readers.

## Add a blog article

1. Copy `POST_TEMPLATE.md` into `locales/<locale>/blog/<slug>.md`.
2. Keep the first fenced block valid JSON. Set `slug` to the filename without `.md`.
3. Add both `visual` and `schema` objects to the metadata. The visual explains the article's main process or idea; the schema shows the data fields or entity relationships behind it.
4. Write the article body in Markdown using H2 sections and H3 subsections. Keep citations as HTTPS Markdown links.
5. Run the site build. It requires both diagrams and checks title and description lengths, tags, dates, slugs, metadata, and Markdown presence before generating the pages.

## Blog feed contract

The build generates `/content/blog.json` with `schemaVersion`, `locale`, and an `items` array. Each item contains the article metadata, canonical internal `url`, tags, key takeaway, `readingTimeMinutes`, visuals, schema, and `bodyMarkdown`. Reading time is calculated automatically at 220 words per minute. A future CMS or API can return this same shape; the page renderer uses text nodes and a small Markdown renderer instead of injecting article HTML.

The current publishing path is static: Markdown is the source of truth and the build produces `/blog/`, `/blog/<slug>/`, and the JSON feed. There is no browser-based editor or write API in the public site.

## Contact button

`PUBLIC_CONTACT_EMAIL` is read at build time. The public site renders it as a `mailto:` link; no mail service or visitor data collection is involved.
