import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'src');
const output = path.join(root, 'dist');

function requireString(value, label, pattern) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${label} must be a non-empty string`);
  if (pattern && !pattern.test(value)) throw new Error(`${label} has an invalid format`);
  return value.trim();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

const aboutIconPaths = {
  server: 'M4 5h16v6H4zM4 13h16v6H4zM7 8h.01M7 16h.01M11 8h6M11 16h6',
  shield: 'M12 3 19 6v5c0 4.6-2.9 8-7 10-4.1-2-7-5.4-7-10V6l7-3Zm-3 9 2 2 4-4',
  lightbulb: 'M9 18h6m-5 4h4m-5-8a6 6 0 1 1 6 0c-.8.6-1 1.3-1 2h-4c0-.7-.2-1.4-1-2Z',
  route: 'M4 19 9 5l3 8 8-8-4 14-4-8-8 8Z'
};

function renderAboutPoints(points) {
  return `<ul class="about-point-list">${points.map((point) => `<li><span class="about-point-icon icon-${point.icon}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${aboutIconPaths[point.icon]}"/></svg></span><p>${escapeHtml(point.text)}</p></li>`).join('')}</ul>`;
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

function renderInline(sourceText) {
  const links = [];
  const tokenized = sourceText.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, (whole, label, href) => {
    const safeHref = safeHttpsUrl(href);
    if (!safeHref) return whole;
    const token = `@@SAFE_LINK_${links.length}@@`;
    links.push(`<a href="${escapeHtml(safeHref)}" rel="noreferrer">${escapeHtml(label)}</a>`);
    return token;
  });

  let html = escapeHtml(tokenized);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  for (let i = 0; i < links.length; i += 1) html = html.replace(`@@SAFE_LINK_${i}@@`, links[i]);
  return html;
}

function renderMarkdown(markdown, headingOffset = 1) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const output = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }

    if (line.startsWith('```')) {
      const language = line.slice(3).trim().replace(/[^a-z0-9_-]/gi, '');
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) code.push(lines[index++]);
      if (index < lines.length) index += 1;
      const safeLanguage = language || 'text';
      output.push(`<div class="terminal-block"><div class="terminal-toolbar"><span class="terminal-lights" aria-hidden="true"><i></i><i></i><i></i></span><span class="terminal-language">${escapeHtml(safeLanguage)}</span><button class="terminal-copy" type="button" data-copy-terminal>Copy</button></div><pre><code class="language-${escapeHtml(safeLanguage)}">${escapeHtml(code.join('\n'))}</code></pre></div>`);
      continue;
    }

    const widget = /^<!-- INSERT_DYNAMIC_WIDGET: ([a-z][a-z0-9_-]*) -->$/.exec(line.trim());
    if (widget) {
      output.push(`<aside class="widget-slot" data-widget-slot="${escapeHtml(widget[1])}" aria-label="${escapeHtml(widget[1].replaceAll('_', ' '))}"></aside>`);
      index += 1;
      continue;
    }

    if (/^\|.*\|$/.test(line) && index + 1 < lines.length && /^\|?\s*:?-{3,}/.test(lines[index + 1])) {
      const cells = (value) => value.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((cell) => cell.trim().replaceAll('\\|', '|'));
      const headers = cells(line);
      const rows = [];
      index += 2;
      while (index < lines.length && /^\|.*\|$/.test(lines[index])) {
        rows.push(cells(lines[index++]));
      }
      output.push(`<div class="table-scroll"><table><thead><tr>${headers.map((cell) => `<th scope="col">${renderInline(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((_, cellIndex) => `<td>${renderInline(row[cellIndex] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoted = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) quoted.push(lines[index++].replace(/^>\s?/, '').trim());
      output.push(`<blockquote class="key-takeaway"><p>${renderInline(quoted.join(' '))}</p></blockquote>`);
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const level = Math.min(4, heading[1].length + headingOffset);
      output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(`<li>${renderInline(lines[index].replace(/^\s*[-*]\s+/, ''))}</li>`);
        index += 1;
      }
      output.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(`<li>${renderInline(lines[index].replace(/^\s*\d+\.\s+/, ''))}</li>`);
        index += 1;
      }
      output.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+/.test(lines[index]) && !lines[index].startsWith('```') && !/^\s*[-*]\s+/.test(lines[index]) && !/^\s*\d+\.\s+/.test(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    output.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
  }

  return output.join('\n');
}

function readEnvFile(contents) {
  const values = {};
  for (const line of contents.split(/\r?\n/)) {
    const match = /^\s*(PUBLIC_[A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (match) values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return values;
}

async function loadPublicConfig() {
  let local = {};
  try { local = readEnvFile(await readFile(path.join(root, '.env'), 'utf8')); } catch { /* optional local config */ }
  const email = process.env.PUBLIC_CONTACT_EMAIL || local.PUBLIC_CONTACT_EMAIL || 'oludavid@protonmail.com';
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) throw new Error('PUBLIC_CONTACT_EMAIL is not a valid address');
  const locale = process.env.PUBLIC_SITE_LOCALE || local.PUBLIC_SITE_LOCALE || 'en-US';
  if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(locale)) throw new Error('PUBLIC_SITE_LOCALE must look like en or en-US');
  const rawSiteUrl = process.env.PUBLIC_SITE_URL || local.PUBLIC_SITE_URL || 'https://www.davdao.com';
  const siteUrl = rawSiteUrl ? safeHttpsUrl(rawSiteUrl) : '';
  if (rawSiteUrl && !siteUrl) throw new Error('PUBLIC_SITE_URL must be an HTTPS URL without credentials');
  return { email, locale, siteUrl: siteUrl ? siteUrl.replace(/\/$/, '') : '' };
}

function validateProject(project, index) {
  if (!project || typeof project !== 'object' || Array.isArray(project)) throw new Error(`Project ${index + 1} must be an object`);
  const slug = requireString(project.slug, `Project ${index + 1} slug`, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  const title = requireString(project.title, `${slug} title`);
  const summary = requireString(project.summary, `${slug} summary`);
  const status = requireString(project.status, `${slug} status`);
  const markdown = requireString(project.markdown, `${slug} markdown file`, /^[a-z0-9-]+\.md$/);
  if (!Array.isArray(project.tags) || project.tags.length === 0 || project.tags.some((tag) => typeof tag !== 'string' || !tag.trim())) {
    throw new Error(`${slug} tags must be a non-empty list of strings`);
  }
  const externalUrl = project.externalUrl === '' ? '' : safeHttpsUrl(project.externalUrl);
  if (project.externalUrl !== '' && !externalUrl) throw new Error(`${slug} externalUrl must be HTTPS`);
  const metric = typeof project.metric === 'string' ? project.metric.trim() : '';
  let caseStudy = null;
  if (isRecord(project.caseStudy)) {
    for (const key of ['problem', 'build', 'validation']) requireString(project.caseStudy[key], `${slug} caseStudy.${key}`);
    caseStudy = { problem: project.caseStudy.problem, build: project.caseStudy.build, validation: project.caseStudy.validation };
  }
  return { slug, title, summary, status, markdown, tags: project.tags.map((tag) => tag.trim()), externalUrl, metric, caseStudy };
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateBlogPost(metadata, slug, bodyMarkdown) {
  if (!isRecord(metadata)) throw new Error(`${slug} metadata must be a JSON object`);
  if (metadata.slug !== slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.slug || '')) throw new Error(`${slug} metadata slug must match its filename`);
  for (const key of ['title', 'metaTitle', 'metaDescription', 'summary', 'keyTakeaway', 'openGraphImagePrompt', 'author', 'category', 'publishedAt']) {
    requireString(metadata[key], `${slug}.${key}`);
  }
  if (metadata.metaTitle.length > 60) throw new Error(`${slug}.metaTitle must be 60 characters or fewer`);
  if (metadata.metaDescription.length > 155) throw new Error(`${slug}.metaDescription must be 155 characters or fewer`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.publishedAt) || Number.isNaN(Date.parse(`${metadata.publishedAt}T00:00:00Z`))) throw new Error(`${slug}.publishedAt must be YYYY-MM-DD`);
  if (!Array.isArray(metadata.tags) || metadata.tags.length < 4 || metadata.tags.length > 5 || metadata.tags.some((tag) => typeof tag !== 'string' || !tag.trim())) throw new Error(`${slug}.tags must contain 4 or 5 non-empty strings`);
  if (!isRecord(metadata.visual)) throw new Error(`${slug}.visual is required`);
  for (const key of ['title', 'caption']) requireString(metadata.visual[key], `${slug}.visual.${key}`);
  if (!Array.isArray(metadata.visual.steps) || metadata.visual.steps.length < 3 || metadata.visual.steps.length > 8) throw new Error(`${slug}.visual.steps must contain 3 to 8 steps`);
  metadata.visual.steps.forEach((step, index) => {
    if (!isRecord(step)) throw new Error(`${slug}.visual.steps[${index}] must be an object`);
    requireString(step.label, `${slug}.visual.steps[${index}].label`);
    requireString(step.detail, `${slug}.visual.steps[${index}].detail`);
  });
  if (!isRecord(metadata.schema)) throw new Error(`${slug}.schema is required`);
  for (const key of ['title', 'caption']) requireString(metadata.schema[key], `${slug}.schema.${key}`);
  if (metadata.schema.joinLabel !== undefined) requireString(metadata.schema.joinLabel, `${slug}.schema.joinLabel`);
  if (!Array.isArray(metadata.schema.standards) || metadata.schema.standards.length < 2 || metadata.schema.standards.length > 3) throw new Error(`${slug}.schema.standards must contain 2 or 3 schema definitions`);
  metadata.schema.standards.forEach((standard, standardIndex) => {
    if (!isRecord(standard)) throw new Error(`${slug}.schema.standards[${standardIndex}] must be an object`);
    requireString(standard.name, `${slug}.schema.standards[${standardIndex}].name`);
    if (!Array.isArray(standard.fields) || standard.fields.length < 3 || standard.fields.length > 8) throw new Error(`${slug}.schema.standards[${standardIndex}].fields must contain 3 to 8 fields`);
    standard.fields.forEach((field, fieldIndex) => {
      if (!isRecord(field)) throw new Error(`${slug}.schema field ${fieldIndex + 1} must be an object`);
      requireString(field.name, `${slug}.schema.standards[${standardIndex}].fields[${fieldIndex}].name`);
      requireString(field.meaning, `${slug}.schema.standards[${standardIndex}].fields[${fieldIndex}].meaning`);
    });
  });
  if (!isRecord(metadata.schema.output)) throw new Error(`${slug}.schema.output is required`);
  requireString(metadata.schema.output.name, `${slug}.schema.output.name`);
  if (!Array.isArray(metadata.schema.output.fields) || metadata.schema.output.fields.length < 2 || metadata.schema.output.fields.length > 8 || metadata.schema.output.fields.some((field) => typeof field !== 'string' || !field.trim())) throw new Error(`${slug}.schema.output.fields must contain 2 to 8 field names`);
  if (!bodyMarkdown.trim() || !/^##\s+/.test(bodyMarkdown.trimStart())) throw new Error(`${slug} body must start with an H2 section`);
  const wordCount = bodyMarkdown.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)?.length || 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 220));
  return { ...metadata, tags: metadata.tags.map((tag) => tag.trim()), bodyMarkdown: bodyMarkdown.trim(), wordCount, readingTimeMinutes };
}

function renderBlogInfographics(post) {
  const steps = post.visual.steps.map((step) => `<li class="process-step"><strong>${escapeHtml(step.label)}</strong><p>${escapeHtml(step.detail)}</p></li>`).join('');
  const standards = post.schema.standards.map((standard) => `<article class="schema-standard"><h3>${escapeHtml(standard.name)}</h3><dl>${standard.fields.map((field) => `<div><dt><code>${escapeHtml(field.name)}</code></dt><dd>${escapeHtml(field.meaning)}</dd></div>`).join('')}</dl></article>`).join('');
  const output = `<article class="schema-output"><h3>${escapeHtml(post.schema.output.name)}</h3><ul>${post.schema.output.fields.map((field) => `<li>${escapeHtml(field)}</li>`).join('')}</ul></article>`;
  return `<section class="article-visuals" data-blog-infographics aria-label="Article visuals"><figure class="article-visual-card"><figcaption><p class="eyebrow">At a glance</p><h2>${escapeHtml(post.visual.title)}</h2><p>${escapeHtml(post.visual.caption)}</p></figcaption><ol class="process-flow">${steps}</ol></figure><figure class="article-visual-card schema-card"><figcaption><p class="eyebrow">At a glance</p><h2>${escapeHtml(post.schema.title)}</h2><p>${escapeHtml(post.schema.caption)}</p></figcaption><div class="schema-flow"><div class="schema-standards">${standards}</div><div class="schema-connector" aria-hidden="true"><span>${escapeHtml(post.schema.joinLabel || 'fields map to')}</span><b>→</b></div>${output}</div></figure></section>`;
}

function validateSiteContent(content, locale) {
  if (!isRecord(content) || content.schemaVersion !== 1) throw new Error('site.json must use schemaVersion 1');
  if (content.locale !== locale) throw new Error(`site.json locale must match PUBLIC_SITE_LOCALE (${locale})`);
  if (!['ltr', 'rtl'].includes(content.direction)) throw new Error('site.json direction must be ltr or rtl');
  for (const key of ['site', 'labels', 'hero', 'about', 'experience', 'projects', 'blog', 'professionalDevelopment', 'contact']) {
    if (!isRecord(content[key])) throw new Error(`site.json ${key} must be an object`);
  }
  for (const key of ['name', 'person', 'title', 'description']) requireString(content.site[key], `site.${key}`);
  for (const key of ['skipToContent', 'mainNavigation', 'technologies', 'toolsCount', 'readWriteup', 'repository', 'backToTop', 'backToWork', 'home']) {
    requireString(content.labels[key], `labels.${key}`);
  }
  if (!content.labels.toolsCount.includes('{count}')) throw new Error('labels.toolsCount must include {count} for localized tool totals');
  if (!Array.isArray(content.navigation) || content.navigation.length === 0) throw new Error('site.json navigation must be a non-empty array');
  content.navigation.forEach((item, i) => {
    if (!isRecord(item)) throw new Error(`navigation[${i}] must be an object`);
    requireString(item.label, `navigation[${i}].label`);
    requireString(item.href, `navigation[${i}].href`, /^(?:#[a-z][a-z0-9-]*|\/(?:about|blog)\/)$/);
  });
  for (const key of ['eyebrow', 'title', 'highlight', 'description', 'primaryAction', 'secondaryAction']) requireString(content.hero[key], `hero.${key}`);
  requireString(content.hero.secondaryHref, 'hero.secondaryHref', /^\/about\/$/);
  requireString(content.about.title, 'about.title');
  requireString(content.about.description, 'about.description');
  requireString(content.about.whyHeading, 'about.whyHeading');
  requireString(content.about.whyText, 'about.whyText');
  const aboutIcons = new Set(Object.keys(aboutIconPaths));
  if (!Array.isArray(content.about.points) || content.about.points.length < 1 || content.about.points.length > 6 || content.about.points.some((point) => !isRecord(point) || !aboutIcons.has(point.icon) || typeof point.text !== 'string' || !point.text.trim())) throw new Error('about.points must contain 1 to 6 entries with supported icons and text');
  requireString(content.experience.eyebrow, 'experience.eyebrow');
  requireString(content.experience.title, 'experience.title');
  if (!Array.isArray(content.experience.entries) || content.experience.entries.length === 0) throw new Error('experience.entries must be a non-empty array');
  const experienceIds = new Set();
  content.experience.entries.forEach((entry, i) => {
    if (!isRecord(entry)) throw new Error(`experience.entries[${i}] must be an object`);
    requireString(entry.id, `experience.entries[${i}].id`, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    if (experienceIds.has(entry.id)) throw new Error(`Duplicate experience id: ${entry.id}`);
    experienceIds.add(entry.id);
    for (const key of ['label', 'duration', 'heading']) requireString(entry[key], `experience.entries[${i}].${key}`);
    if (entry.description !== undefined) requireString(entry.description, `experience.entries[${i}].description`);
    if (entry.outcomes !== undefined) {
      if (!Array.isArray(entry.outcomes)) throw new Error(`experience.entries[${i}].outcomes must be an array`);
      entry.outcomes.forEach((outcome, j) => {
        if (!isRecord(outcome)) throw new Error(`experience.entries[${i}].outcomes[${j}] must be an object`);
        requireString(outcome.metric, `experience.entries[${i}].outcomes[${j}].metric`);
        requireString(outcome.description, `experience.entries[${i}].outcomes[${j}].description`);
      });
    }
  });
  for (const key of ['eyebrow', 'title', 'description']) requireString(content.projects[key], `projects.${key}`);
  requireString(content.blog.eyebrow, 'blog.eyebrow');
  requireString(content.blog.title, 'blog.title');
  requireString(content.blog.description, 'blog.description');
  requireString(content.professionalDevelopment.title, 'professionalDevelopment.title');
  for (const key of ['credentials', 'toolCategories']) {
    if (!Array.isArray(content.professionalDevelopment[key])) throw new Error(`professionalDevelopment.${key} must be an array`);
  }
  content.professionalDevelopment.credentials.forEach((item, i) => {
    if (!isRecord(item)) throw new Error(`credentials[${i}] must be an object`);
    for (const key of ['mark', 'name', 'detail']) requireString(item[key], `credentials[${i}].${key}`);
    if (item.url !== undefined && !safeHttpsUrl(item.url)) throw new Error(`credentials[${i}].url must be a safe HTTPS URL`);
  });
  content.professionalDevelopment.toolCategories.forEach((item, i) => {
    if (!isRecord(item)) throw new Error(`toolCategories[${i}] must be an object`);
    requireString(item.id, `toolCategories[${i}].id`, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    requireString(item.name, `toolCategories[${i}].name`);
    if (!Array.isArray(item.tools) || item.tools.length === 0 || item.tools.some((tool) => typeof tool !== 'string' || !tool.trim())) {
      throw new Error(`toolCategories[${i}].tools must be a non-empty string array`);
    }
  });
  for (const key of ['eyebrow', 'title', 'highlight', 'description', 'emailSubject', 'emailLabel', 'githubLabel', 'githubUrl', 'linkedinUrl', 'keybaseUrl']) requireString(content.contact[key], `contact.${key}`);
  for (const key of ['githubUrl', 'linkedinUrl', 'keybaseUrl']) {
    if (!safeHttpsUrl(content.contact[key])) throw new Error(`contact.${key} must be a safe HTTPS URL`);
  }
  requireString(content.footer, 'footer');
  return content;
}

const { email, locale, siteUrl } = await loadPublicConfig();
const localeDir = path.join(source, 'content', 'locales', locale);
const projectDir = path.join(localeDir, 'projects');
const blogDir = path.join(localeDir, 'blog');
const rawSiteContent = JSON.parse(await readFile(path.join(localeDir, 'site.json'), 'utf8'));
const siteContent = validateSiteContent(rawSiteContent, locale);
const rawProjects = JSON.parse(await readFile(path.join(localeDir, 'projects.json'), 'utf8'));
if (!Array.isArray(rawProjects) || rawProjects.length === 0) throw new Error('projects.json must contain at least one project');
const projects = rawProjects.map(validateProject);
if (new Set(projects.map((item) => item.slug)).size !== projects.length) throw new Error('Project slugs must be unique');
const projectEntries = await Promise.all(projects.map(async (project) => {
  const markdownPath = path.resolve(projectDir, project.markdown);
  if (!markdownPath.startsWith(`${projectDir}${path.sep}`)) throw new Error(`${project.slug} markdown path escaped its content directory`);
  return { ...project, writeupMarkdown: await readFile(markdownPath, 'utf8') };
}));
const blogFiles = (await readdir(blogDir)).filter((file) => /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(file)).sort();
const blogEntries = await Promise.all(blogFiles.map(async (file) => {
  const slug = file.slice(0, -3);
  const markdown = await readFile(path.join(blogDir, file), 'utf8');
  const match = /^```json\s*\n([\s\S]*?)\n```\s*\n([\s\S]*)$/.exec(markdown);
  if (!match) throw new Error(`${file} must begin with a fenced JSON metadata block`);
  let metadata;
  try { metadata = JSON.parse(match[1]); } catch { throw new Error(`${file} contains invalid metadata JSON`); }
  return validateBlogPost(metadata, slug, match[2]);
}));
if (blogEntries.length === 0) throw new Error('At least one blog Markdown post is required');
if (new Set(blogEntries.map((post) => post.slug)).size !== blogEntries.length) throw new Error('Blog slugs must be unique');
blogEntries.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title));

await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'assets'), { recursive: true });
await mkdir(path.join(output, 'projects'), { recursive: true });
await mkdir(path.join(output, 'about'), { recursive: true });
await mkdir(path.join(output, 'blog'), { recursive: true });
await mkdir(path.join(output, 'content'), { recursive: true });
await cp(path.join(source, 'assets', 'styles.css'), path.join(output, 'assets', 'styles.css'));
await cp(path.join(source, 'assets', 'content.js'), path.join(output, 'assets', 'content.js'));
await cp(path.join(source, 'assets', 'reader.js'), path.join(output, 'assets', 'reader.js'));
await cp(path.join(source, 'assets', 'interactive.js'), path.join(output, 'assets', 'interactive.js'));
await cp(path.join(source, 'assets', 'stepper.js'), path.join(output, 'assets', 'stepper.js'));
await cp(path.join(source, 'assets', 'highlight-init.js'), path.join(output, 'assets', 'highlight-init.js'));
await cp(path.join(source, 'assets', 'icons'), path.join(output, 'assets', 'icons'), { recursive: true });
await cp(path.join(root, 'public', '_headers'), path.join(output, '_headers'));
await cp(path.join(root, 'public', 'robots.txt'), path.join(output, 'robots.txt'));

const publicSiteContent = { ...siteContent, contact: { ...siteContent.contact, email } };
const publicProjects = projectEntries.map(({ slug, title, summary, status, tags, externalUrl, writeupMarkdown }) => ({
  id: slug,
  slug,
  title,
  summary,
  status,
  tags,
  url: `/projects/${slug}.html`,
  externalUrl,
  writeupMarkdown
}));
const publicBlog = blogEntries.map((post) => ({
  ...post,
  url: `/blog/${post.slug}/`
}));
await writeFile(path.join(output, 'content', 'site.json'), JSON.stringify(publicSiteContent, null, 2));
await writeFile(path.join(output, 'content', 'projects.json'), JSON.stringify({ schemaVersion: 1, locale, items: publicProjects }, null, 2));
await writeFile(path.join(output, 'content', 'blog.json'), JSON.stringify({ schemaVersion: 1, locale, items: publicBlog }, null, 2));
const feedItems = publicBlog.map((post) => ({
  id: `${siteUrl}${post.url}`,
  url: `${siteUrl}${post.url}`,
  title: post.title,
  summary: post.summary,
  content_text: post.bodyMarkdown,
  _key_takeaway: post.keyTakeaway,
  _visual: post.visual,
  _schema: post.schema,
  _reading_time_minutes: post.readingTimeMinutes,
  date_published: `${post.publishedAt}T00:00:00Z`,
  date_modified: `${post.updatedAt || post.publishedAt}T00:00:00Z`,
  authors: [{ name: post.author }],
  tags: post.tags
}));
await writeFile(path.join(output, 'blog', 'feed.json'), JSON.stringify({
  version: 'https://jsonfeed.org/version/1.1',
  title: siteContent.blog.title,
  home_page_url: `${siteUrl}/blog/`,
  feed_url: `${siteUrl}/blog/feed.json`,
  description: siteContent.blog.description,
  language: locale,
  items: feedItems
}, null, 2));

const navLinks = siteContent.navigation.map((item) => {
  const contactClass = item.href === '#contact' ? ' class="nav-contact"' : '';
  const href = item.href.startsWith('#') ? `/${item.href}` : item.href;
  return `<a href="${escapeHtml(href)}"${contactClass}>${escapeHtml(item.label)}</a>`;
}).join('');
const sideNavLinks = siteContent.navigation.map((item) => {
  const href = item.href.startsWith('#') ? `/${item.href}` : item.href;
  return `<a href="${escapeHtml(href)}">${escapeHtml(item.label)}</a>`;
}).join('');
const sideNav = `<details class="side-navigator" data-side-navigator><summary aria-label="Toggle section navigator"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z"/></svg><span>Sections</span></summary><div class="side-navigator-panel"><p>Jump to</p><nav aria-label="Section navigator" data-content-side-links>${sideNavLinks}</nav></div></details>`;
const messageShortcut = `<a class="message-shortcut" data-message-shortcut href="mailto:${escapeHtml(email)}?subject=${encodeURIComponent(siteContent.contact.emailSubject)}" aria-label="Send email to ${escapeHtml(email)}" title="Send email"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v11H9l-5 3v-14Z"/><path d="M8 9h8M8 12.5h5"/></svg></a>`;
const socialLinksMarkup = [
  { name: 'linkedin', label: 'LinkedIn', href: siteContent.contact.linkedinUrl },
  { name: 'email', label: 'Email', href: `mailto:${email}?subject=${encodeURIComponent(siteContent.contact.emailSubject)}` },
  { name: 'github', label: 'GitHub', href: siteContent.contact.githubUrl },
  { name: 'keybase', label: 'Keybase', href: siteContent.contact.keybaseUrl }
].map((item) => `<a class="social-icon-link social-icon-${item.name}" href="${escapeHtml(item.href)}" aria-label="${item.label}" title="${item.label}"${item.name === 'email' ? '' : ' rel="noreferrer"'}><img src="/assets/icons/${item.name}.svg" alt="" width="24" height="24" aria-hidden="true"></a>`).join('');

const experienceEntries = siteContent.experience.entries.map((entry) => {
  const outcomes = (entry.outcomes || []).map((item) => `<article class="evidence-card"><strong>${escapeHtml(item.metric)}</strong><p>${escapeHtml(item.description)}</p></article>`).join('');
  const description = entry.description ? `<p>${escapeHtml(entry.description)}</p>` : '';
  const outcomesMarkup = outcomes ? `<div class="evidence-grid" aria-label="${escapeHtml(entry.label)}">${outcomes}</div>` : '';
  return `<li class="timeline-entry"><div class="experience-card-head"><p class="entry-meta">${escapeHtml(entry.label)}</p><span class="experience-duration">${escapeHtml(entry.duration)}</span></div><div class="timeline-content"><h3>${escapeHtml(entry.heading)}</h3>${description}${outcomesMarkup}</div></li>`;
}).join('\n');
const aboutParagraphs = renderAboutPoints(siteContent.about.points);
const aboutWhy = `<section class="about-why" aria-labelledby="about-why-title"><h2 id="about-why-title">${escapeHtml(siteContent.about.whyHeading)}</h2><div class="about-why-copy">${siteContent.about.whyText.split(/\n\s*\n/).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div></section>`;

const credentialsMarkup = siteContent.professionalDevelopment.credentials.map((item) => {
  const status = item.status ? `<span class="credential-status">${escapeHtml(item.status)}</span>` : '';
  const content = `<span class="credential-mark">${escapeHtml(item.mark)}</span><div><h3>${escapeHtml(item.name)}${status}</h3><p>${escapeHtml(item.detail)}</p></div>`;
  return item.url
    ? `<a class="credential credential-link-card" href="${escapeHtml(item.url)}" rel="noreferrer" aria-label="Open official verification page for ${escapeHtml(item.name)}">${content}</a>`
    : `<article class="credential">${content}</article>`;
}).join('\n');

const toolCategories = siteContent.professionalDevelopment.toolCategories.map((category, index) => {
  const number = String(index + 1).padStart(2, '0');
  const tools = category.tools.map((tool) => `<li>${escapeHtml(tool)}</li>`).join('');
  const count = siteContent.labels.toolsCount.replace('{count}', String(category.tools.length));
  return `<article class="tool-category" data-category="${escapeHtml(category.id)}"><div class="tool-card-heading"><span class="tool-index">${number}</span><h3>${escapeHtml(category.name)}</h3><span class="tool-count">${escapeHtml(count)}</span></div><ul class="tool-chip-list" aria-label="${escapeHtml(category.name)}">${tools}</ul></article>`;
}).join('\n');

const skillPalette = ['#83aaff', '#5fd49a', '#a891e6', '#d08b6a'];
const skillNodes = siteContent.professionalDevelopment.toolCategories.flatMap((cat, ci) =>
  cat.tools.map((tool) => `<button type="button" class="skill-node" data-cat="${ci}" style="--node:${skillPalette[ci % skillPalette.length]}">${escapeHtml(tool)}</button>`)
).join('');
const skillLegend = siteContent.professionalDevelopment.toolCategories.map((cat, ci) =>
  `<li data-legend="${ci}" style="--node:${skillPalette[ci % skillPalette.length]}"><span class="legend-dot" aria-hidden="true"></span>${escapeHtml(cat.name)}</li>`
).join('');

const cards = projects.map((project) => {
  const external = project.externalUrl
    ? `<a href="${escapeHtml(project.externalUrl)}" rel="noreferrer">${escapeHtml(siteContent.labels.repository)}</a>`
    : '';
  const metric = project.metric ? `<span class="project-metric">${escapeHtml(project.metric)}</span>` : '';
  const tags = (project.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
  const cs = project.caseStudy;
  const panel = cs
    ? `<div class="case-panel" hidden><div class="case-step"><h4>Problem</h4><p>${escapeHtml(cs.problem)}</p></div><div class="case-step"><h4>Build</h4><p>${escapeHtml(cs.build)}</p></div><div class="case-step"><h4>Validation</h4><p>${escapeHtml(cs.validation)}</p></div></div>`
    : '';
  const toggle = cs
    ? `<button class="case-toggle" type="button" aria-expanded="false" data-case-toggle>Read the case study <span class="case-toggle-mark" aria-hidden="true">+</span></button>`
    : '';
  return `<article class="project-card"><div class="project-card-head"><span class="project-status">${escapeHtml(project.status)}</span>${metric}</div><h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.summary)}</p><div class="tag-list">${tags}</div><div class="project-actions">${toggle}<a href="/projects/${escapeHtml(project.slug)}.html">${escapeHtml(siteContent.labels.readWriteup)}</a>${external}</div>${panel}</article>`;
}).join('\n');
const blogPosts = publicBlog.slice(0, 3).map((post) => `<article class="blog-card"><p class="blog-card-label">${escapeHtml(post.category)} · ${escapeHtml(post.publishedAt)} · ${post.readingTimeMinutes} min read</p><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.summary)}</p><div class="blog-card-tags">${post.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div><a href="${escapeHtml(post.url)}">Read article <span aria-hidden="true">→</span></a></article>`).join('\n');
const blogIndexCards = publicBlog.map((post) => `<article class="blog-card" data-blog-card data-search-text="${escapeHtml([post.title, post.summary, post.category, ...post.tags].join(' ').toLowerCase())}" data-search-tags="${escapeHtml(post.tags.join(' '))}"><p class="blog-card-label">${escapeHtml(post.category)} · ${escapeHtml(post.publishedAt)} · ${post.readingTimeMinutes} min read</p><h2><a href="${escapeHtml(post.url)}">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.summary)}</p><div class="blog-card-tags">${post.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div><a class="blog-read-link" href="${escapeHtml(post.url)}">Read article <span aria-hidden="true">→</span></a></article>`).join('\n');

const indexTemplate = await readFile(path.join(source, 'index.html'), 'utf8');
const canonical = siteUrl ? `<link rel="canonical" href="${escapeHtml(siteUrl)}/">` : '';
const indexHtml = indexTemplate
  .replaceAll('{{LANG}}', escapeHtml(locale))
  .replaceAll('{{DIR}}', escapeHtml(siteContent.direction))
  .replaceAll('{{DESCRIPTION}}', escapeHtml(siteContent.site.description))
  .replaceAll('{{PAGE_TITLE}}', escapeHtml(siteContent.site.title))
  .replaceAll('{{SKIP_LABEL}}', escapeHtml(siteContent.labels.skipToContent))
  .replaceAll('{{SIDE_NAV}}', sideNav)
  .replaceAll('{{MESSAGE_SHORTCUT}}', messageShortcut)
  .replaceAll('{{SOCIAL_LINKS}}', socialLinksMarkup)
  .replaceAll('{{BRAND_ARIA}}', escapeHtml(`${siteContent.site.name} — ${siteContent.site.person}, home`))
  .replaceAll('{{BRAND_NAME}}', escapeHtml(siteContent.site.name))
  .replaceAll('{{BRAND_BYLINE}}', escapeHtml(`${siteContent.site.person} · Security Engineering`))
  .replaceAll('{{NAV_LABEL}}', escapeHtml(siteContent.labels.mainNavigation))
  .replaceAll('{{NAV_LINKS}}', navLinks)
  .replaceAll('{{HERO_BADGE}}', escapeHtml(siteContent.hero.badge))
  .replaceAll('{{SPOTLIGHT_BEFORE}}', escapeHtml(siteContent.spotlight.result.before))
  .replaceAll('{{SPOTLIGHT_AFTER}}', escapeHtml(siteContent.spotlight.result.after))
  .replaceAll('{{SPOTLIGHT_LABEL}}', escapeHtml(siteContent.spotlight.result.label))
  .replaceAll('{{SPOTLIGHT_NOTE}}', escapeHtml(siteContent.spotlight.result.note))
  .replaceAll('{{SPOTLIGHT_FACTS}}', siteContent.spotlight.facts.map((f) => `<div class="fact"><dt>${escapeHtml(f.label)}</dt><dd>${escapeHtml(f.value)}</dd></div>`).join(''))
  .replaceAll('{{SKILL_NODES}}', skillNodes)
  .replaceAll('{{SKILL_LEGEND}}', skillLegend)
  .replaceAll('{{FEATURED_EYEBROW}}', escapeHtml(siteContent.featured.eyebrow))
  .replaceAll('{{FEATURED_TITLE}}', escapeHtml(siteContent.featured.title))
  .replaceAll('{{FEATURED_SUMMARY}}', escapeHtml(siteContent.featured.summary))
  .replaceAll('{{FEATURED_POINTS}}', siteContent.featured.points.map((p) => `<li>${escapeHtml(p)}</li>`).join(''))
  .replaceAll('{{FEATURED_META}}', siteContent.featured.meta.map((m) => `<div class="featured-fact"><dt>${escapeHtml(m.label)}</dt><dd>${escapeHtml(m.value)}</dd></div>`).join(''))
  .replaceAll('{{FEATURED_PRIMARY_HREF}}', escapeHtml(siteContent.featured.primaryHref))
  .replaceAll('{{FEATURED_PRIMARY_LABEL}}', escapeHtml(siteContent.featured.primaryLabel))
  .replaceAll('{{FEATURED_SECONDARY_HREF}}', escapeHtml(siteContent.featured.secondaryHref))
  .replaceAll('{{FEATURED_SECONDARY_LABEL}}', escapeHtml(siteContent.featured.secondaryLabel))
  .replaceAll('{{JOURNEY_EYEBROW}}', escapeHtml(siteContent.journey.eyebrow))
  .replaceAll('{{JOURNEY_TITLE}}', escapeHtml(siteContent.journey.title))
  .replaceAll('{{JOURNEY_HOPS}}', siteContent.journey.hops.map((h) => `<li class="route-hop"><span class="route-n">${escapeHtml(h.n)}</span><div class="route-body"><h3>${escapeHtml(h.title)}</h3><p>${escapeHtml(h.detail)}</p></div></li>`).join(''))
  .replaceAll('{{HERO_EYEBROW}}', escapeHtml(siteContent.hero.eyebrow))
  .replaceAll('{{HERO_TITLE}}', escapeHtml(siteContent.hero.title))
  .replaceAll('{{HERO_HIGHLIGHT}}', escapeHtml(siteContent.hero.highlight))
  .replaceAll('{{HERO_DESCRIPTION}}', escapeHtml(siteContent.hero.description))
  .replaceAll('{{HERO_PRIMARY}}', escapeHtml(siteContent.hero.primaryAction))
  .replaceAll('{{HERO_SECONDARY}}', escapeHtml(siteContent.hero.secondaryAction))
  .replaceAll('{{HERO_SECONDARY_HREF}}', escapeHtml(siteContent.hero.secondaryHref))
  .replaceAll('{{EXPERIENCE_EYEBROW}}', escapeHtml(siteContent.experience.eyebrow))
  .replaceAll('{{EXPERIENCE_TITLE}}', escapeHtml(siteContent.experience.title))
  .replaceAll('{{EXPERIENCE_ENTRIES}}', experienceEntries)
  .replaceAll('{{PROJECTS_EYEBROW}}', escapeHtml(siteContent.projects.eyebrow))
  .replaceAll('{{PROJECTS_TITLE}}', escapeHtml(siteContent.projects.title))
  .replaceAll('{{PROJECTS_DESCRIPTION}}', escapeHtml(siteContent.projects.description))
  .replaceAll('{{PROJECT_CARDS}}', cards)
  .replaceAll('{{BLOG_EYEBROW}}', escapeHtml(siteContent.blog.eyebrow))
  .replaceAll('{{BLOG_TITLE}}', escapeHtml(siteContent.blog.title))
  .replaceAll('{{BLOG_DESCRIPTION}}', escapeHtml(siteContent.blog.description))
  .replaceAll('{{BLOG_POSTS}}', blogPosts)
  .replaceAll('{{DEVELOPMENT_TITLE}}', escapeHtml(siteContent.professionalDevelopment.title))
  .replaceAll('{{CREDENTIALS}}', credentialsMarkup)
  .replaceAll('{{TOOLS_LABEL}}', escapeHtml(siteContent.labels.technologies))
  .replaceAll('{{TOOL_CATEGORIES}}', toolCategories)
  .replaceAll('{{CONTACT_EYEBROW}}', escapeHtml(siteContent.contact.eyebrow))
  .replaceAll('{{CONTACT_TITLE}}', escapeHtml(siteContent.contact.title))
  .replaceAll('{{CONTACT_HIGHLIGHT}}', escapeHtml(siteContent.contact.highlight))
  .replaceAll('{{CONTACT_DESCRIPTION}}', escapeHtml(siteContent.contact.description))
  .replaceAll('{{CONTACT_EMAIL}}', escapeHtml(email))
  .replaceAll('{{CONTACT_SUBJECT}}', encodeURIComponent(siteContent.contact.emailSubject))
  .replaceAll('{{EMAIL_LABEL}}', escapeHtml(siteContent.contact.emailLabel))
  .replaceAll('{{GITHUB_URL}}', escapeHtml(siteContent.contact.githubUrl))
  .replaceAll('{{GITHUB_LABEL}}', escapeHtml(siteContent.contact.githubLabel))
  .replaceAll('{{FOOTER}}', escapeHtml(siteContent.footer))
  .replaceAll('{{BACK_TO_TOP}}', escapeHtml(siteContent.labels.backToTop))
  .replaceAll('{{CANONICAL_LINK}}', canonical);
if (/\{\{[A-Z_]+\}\}/.test(indexHtml)) throw new Error('Unresolved template token in index.html');
await writeFile(path.join(output, 'index.html'), indexHtml);

const aboutTemplate = await readFile(path.join(source, 'templates', 'about.html'), 'utf8');
const aboutCanonical = siteUrl ? `<link rel="canonical" href="${escapeHtml(siteUrl)}/about/">` : '';
const aboutHtml = aboutTemplate
  .replaceAll('{{LANG}}', escapeHtml(locale))
  .replaceAll('{{DIR}}', escapeHtml(siteContent.direction))
  .replaceAll('{{DESCRIPTION}}', escapeHtml(siteContent.about.description))
  .replaceAll('{{PAGE_TITLE}}', escapeHtml(`${siteContent.about.title} — ${siteContent.site.name}`))
  .replaceAll('{{CANONICAL_LINK}}', aboutCanonical)
  .replaceAll('{{SKIP_LABEL}}', escapeHtml(siteContent.labels.skipToContent))
  .replaceAll('{{SIDE_NAV}}', sideNav)
  .replaceAll('{{MESSAGE_SHORTCUT}}', messageShortcut)
  .replaceAll('{{SOCIAL_LINKS}}', socialLinksMarkup)
  .replaceAll('{{BRAND_ARIA}}', escapeHtml(`${siteContent.site.name} — ${siteContent.site.person}, home`))
  .replaceAll('{{BRAND_NAME}}', escapeHtml(siteContent.site.name))
  .replaceAll('{{BRAND_BYLINE}}', escapeHtml(`${siteContent.site.person} · Security Engineering`))
  .replaceAll('{{NAV_LABEL}}', escapeHtml(siteContent.labels.mainNavigation))
  .replaceAll('{{NAV_LINKS}}', navLinks)
  .replaceAll('{{ABOUT_TITLE}}', escapeHtml(siteContent.about.title))
  .replaceAll('{{ABOUT_PARAGRAPHS}}', aboutParagraphs)
  .replaceAll('{{ABOUT_WHY}}', aboutWhy)
  .replaceAll('{{FOOTER}}', escapeHtml(siteContent.footer))
  .replaceAll('{{HOME_LABEL}}', escapeHtml(siteContent.labels.home));
if (/\{\{[A-Z_]+\}\}/.test(aboutHtml)) throw new Error('Unresolved template token in about page');
await writeFile(path.join(output, 'about', 'index.html'), aboutHtml);

const blogIndexTemplate = await readFile(path.join(source, 'templates', 'blog-index.html'), 'utf8');
const blogIndexCanonical = siteUrl ? `<link rel="canonical" href="${escapeHtml(siteUrl)}/blog/">` : '';
const blogIndexHtml = blogIndexTemplate
  .replaceAll('{{LANG}}', escapeHtml(locale))
  .replaceAll('{{DIR}}', escapeHtml(siteContent.direction))
  .replaceAll('{{DESCRIPTION}}', escapeHtml(siteContent.blog.description))
  .replaceAll('{{PAGE_TITLE}}', escapeHtml(`${siteContent.blog.title} — ${siteContent.site.name}`))
  .replaceAll('{{SKIP_LABEL}}', escapeHtml(siteContent.labels.skipToContent))
  .replaceAll('{{SIDE_NAV}}', sideNav)
  .replaceAll('{{MESSAGE_SHORTCUT}}', messageShortcut)
  .replaceAll('{{SOCIAL_LINKS}}', socialLinksMarkup)
  .replaceAll('{{BRAND_ARIA}}', escapeHtml(`${siteContent.site.name} — ${siteContent.site.person}, home`))
  .replaceAll('{{BRAND_NAME}}', escapeHtml(siteContent.site.name))
  .replaceAll('{{BRAND_BYLINE}}', escapeHtml(`${siteContent.site.person} · Security Engineering`))
  .replaceAll('{{NAV_LABEL}}', escapeHtml(siteContent.labels.mainNavigation))
  .replaceAll('{{NAV_LINKS}}', navLinks)
  .replaceAll('{{BLOG_EYEBROW}}', escapeHtml(siteContent.blog.eyebrow))
  .replaceAll('{{BLOG_TITLE}}', escapeHtml(siteContent.blog.title))
  .replaceAll('{{BLOG_DESCRIPTION}}', escapeHtml(siteContent.blog.description))
  .replaceAll('{{BLOG_POSTS}}', blogIndexCards)
  .replaceAll('{{BLOG_COUNT}}', `${publicBlog.length} ${publicBlog.length === 1 ? 'article' : 'articles'}`)
  .replaceAll('{{HOME_LABEL}}', escapeHtml(siteContent.labels.home))
  .replaceAll('{{FOOTER}}', escapeHtml(siteContent.footer))
  .replaceAll('{{CANONICAL_LINK}}', blogIndexCanonical);
if (/\{\{[A-Z_]+\}\}/.test(blogIndexHtml)) throw new Error('Unresolved template token in blog index');
await writeFile(path.join(output, 'blog', 'index.html'), blogIndexHtml);

const blogPostTemplate = await readFile(path.join(source, 'templates', 'blog-post.html'), 'utf8');
for (const post of publicBlog) {
  const canonicalTag = siteUrl ? `<link rel="canonical" href="${escapeHtml(siteUrl)}${escapeHtml(post.url)}">` : '';
  const tags = post.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
  const html = blogPostTemplate
    .replaceAll('{{LANG}}', escapeHtml(locale))
    .replaceAll('{{DIR}}', escapeHtml(siteContent.direction))
    .replaceAll('{{META_DESCRIPTION}}', escapeHtml(post.metaDescription))
    .replaceAll('{{META_TITLE}}', escapeHtml(post.metaTitle))
    .replaceAll('{{PUBLISHED_AT}}', escapeHtml(post.publishedAt))
    .replaceAll('{{UPDATED_AT}}', escapeHtml(post.updatedAt || post.publishedAt))
    .replaceAll('{{CANONICAL_LINK}}', canonicalTag)
    .replaceAll('{{SKIP_LABEL}}', escapeHtml(siteContent.labels.skipToContent))
    .replaceAll('{{SIDE_NAV}}', sideNav)
    .replaceAll('{{MESSAGE_SHORTCUT}}', messageShortcut)
    .replaceAll('{{SOCIAL_LINKS}}', socialLinksMarkup)
    .replaceAll('{{BRAND_ARIA}}', escapeHtml(`${siteContent.site.name} — ${siteContent.site.person}, home`))
    .replaceAll('{{BRAND_NAME}}', escapeHtml(siteContent.site.name))
    .replaceAll('{{BRAND_BYLINE}}', escapeHtml(`${siteContent.site.person} · Security Engineering`))
    .replaceAll('{{NAV_LABEL}}', escapeHtml(siteContent.labels.mainNavigation))
    .replaceAll('{{NAV_LINKS}}', navLinks)
    .replaceAll('{{BLOG_SLUG}}', escapeHtml(post.slug))
    .replaceAll('{{BLOG_CATEGORY}}', escapeHtml(post.category))
    .replaceAll('{{READING_TIME}}', `${post.readingTimeMinutes} min read`)
    .replaceAll('{{BLOG_TITLE}}', escapeHtml(post.title))
    .replaceAll('{{BLOG_SUMMARY}}', escapeHtml(post.summary))
    .replaceAll('{{BLOG_AUTHOR}}', escapeHtml(post.author))
    .replaceAll('{{BLOG_TAGS}}', tags)
    .replaceAll('{{KEY_TAKEAWAY}}', escapeHtml(post.keyTakeaway))
    .replaceAll('{{BLOG_INFOGRAPHICS}}', () => renderBlogInfographics(post))
    .replaceAll('{{BLOG_BODY}}', () => renderMarkdown(post.bodyMarkdown, 0))
    .replaceAll('{{FOOTER}}', escapeHtml(siteContent.footer))
    .replaceAll('{{HOME_LABEL}}', escapeHtml(siteContent.labels.home));
  if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error(`Unresolved template token in blog/${post.slug}`);
  const postDirectory = path.join(output, 'blog', post.slug);
  await mkdir(postDirectory, { recursive: true });
  await writeFile(path.join(postDirectory, 'index.html'), html);
}

const projectTemplate = await readFile(path.join(source, 'templates', 'project.html'), 'utf8');
for (const project of projectEntries) {
  const markdown = project.writeupMarkdown;
  const tags = project.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
  const canonicalTag = siteUrl ? `<link rel="canonical" href="${escapeHtml(siteUrl)}/projects/${escapeHtml(project.slug)}.html">` : '';
  const html = projectTemplate
    .replaceAll('{{DESCRIPTION}}', escapeHtml(project.summary))
    .replaceAll('{{LANG}}', escapeHtml(locale))
    .replaceAll('{{DIR}}', escapeHtml(siteContent.direction))
    .replaceAll('{{SKIP_LABEL}}', escapeHtml(siteContent.labels.skipToContent))
    .replaceAll('{{SIDE_NAV}}', sideNav)
    .replaceAll('{{MESSAGE_SHORTCUT}}', messageShortcut)
    .replaceAll('{{SOCIAL_LINKS}}', socialLinksMarkup)
    .replaceAll('{{BRAND_ARIA}}', escapeHtml(`${siteContent.site.name} — ${siteContent.site.person}, home`))
    .replaceAll('{{BRAND_NAME}}', escapeHtml(siteContent.site.name))
    .replaceAll('{{BRAND_BYLINE}}', escapeHtml(`${siteContent.site.person} · Security Engineering`))
    .replaceAll('{{NAV_LABEL}}', escapeHtml(siteContent.labels.mainNavigation))
    .replaceAll('{{NAV_LINKS}}', navLinks)
    .replaceAll('{{NAV_EXPERIENCE}}', escapeHtml(siteContent.navigation[0]?.label || 'Experience'))
    .replaceAll('{{NAV_WORK}}', escapeHtml(siteContent.navigation.find((item) => item.href === '#work')?.label || siteContent.projects.title))
    .replaceAll('{{NAV_DEVELOPMENT}}', escapeHtml(siteContent.navigation.find((item) => item.href === '#credentials')?.label || siteContent.professionalDevelopment.title))
    .replaceAll('{{NAV_CONTACT}}', escapeHtml(siteContent.navigation.find((item) => item.href === '#contact')?.label || 'Contact'))
    .replaceAll('{{SKIP_LABEL}}', escapeHtml(siteContent.labels.skipToContent))
    .replaceAll('{{BACK_TO_WORK}}', escapeHtml(siteContent.labels.backToWork))
    .replaceAll('{{WORK_LABEL}}', escapeHtml(siteContent.navigation.find((item) => item.href === '#work')?.label || siteContent.projects.title))
    .replaceAll('{{FOOTER}}', escapeHtml(siteContent.footer))
    .replaceAll('{{BACK_HOME}}', escapeHtml(siteContent.labels.home))
    .replaceAll('{{PROJECT_SLUG}}', escapeHtml(project.slug))
    .replaceAll('{{CANONICAL_LINK}}', canonicalTag)
    .replaceAll('{{TITLE}}', escapeHtml(project.title))
    .replaceAll('{{STATUS}}', escapeHtml(project.status))
    .replaceAll('{{SUMMARY}}', escapeHtml(project.summary))
    .replaceAll('{{TAGS}}', tags)
    .replaceAll('{{BODY}}', () => renderMarkdown(markdown));
  if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error(`Unresolved template token in ${project.slug}`);
  await writeFile(path.join(output, 'projects', `${project.slug}.html`), html);
}

if (siteUrl) {
  const sitemapUrls = [
    `${siteUrl}/`,
    `${siteUrl}/about/`,
    `${siteUrl}/blog/`,
    ...publicBlog.map((post) => `${siteUrl}${post.url}`),
    ...projectEntries.map((project) => `${siteUrl}/projects/${project.slug}.html`)
  ];
  const xmlEscape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map((url) => `  <url><loc>${xmlEscape(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
  await writeFile(path.join(output, 'sitemap.xml'), sitemap);
  const robotsPath = path.join(output, 'robots.txt');
  const robots = await readFile(robotsPath, 'utf8');
  await writeFile(robotsPath, `${robots.trimEnd()}\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
}

console.log(`Built ${projects.length} project pages and ${publicBlog.length} blog articles in dist/`);
