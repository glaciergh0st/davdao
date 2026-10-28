(() => {
  'use strict';

  const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  const isText = (value) => typeof value === 'string' && value.trim().length > 0;
  const safeHttps = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
    } catch {
      return null;
    }
  };
  const make = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  const iconPaths = {
    shield: 'M12 3 19 6v5c0 4.6-2.9 8-7 10-4.1-2-7-5.4-7-10V6l7-3Zm-3 9 2 2 4-4',
    layers: 'm12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5',
    cloud: 'M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9a4.5 4.5 0 0 0 1 9Z',
    pulse: 'M3 12h4l2-6 4 12 2-6h6',
    network: 'M12 12 5 5m7 7 7-7m-7 7-7 7m7-7 7 7M5 5h.01M19 5h.01M5 19h.01M19 19h.01M12 12h.01',
    server: 'M4 5h16v6H4zM4 13h16v6H4zM7 8h.01M7 16h.01M11 8h6M11 16h6',
    lightbulb: 'M9 18h6m-5 4h4m-5-8a6 6 0 1 1 6 0c-.8.6-1 1.3-1 2h-4c0-.7-.2-1.4-1-2Z',
    route: 'M4 19 9 5l3 8 8-8-4 14-4-8-8 8Z'
  };
  const makeIcon = (name, className = 'portfolio-icon') => {
    const wrap = make('span', className);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.6');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', iconPaths[name] || iconPaths.layers);
    svg.append(path);
    wrap.append(svg);
    return wrap;
  };
  const setText = (selector, value, parent = document) => {
    const node = parent.querySelector(selector);
    if (node && isText(value)) node.textContent = value;
  };
  const setLink = (node, href) => {
    if (node && typeof href === 'string' && /^(?:#[a-z][a-z0-9-]*|\/#(?:[a-z][a-z0-9-]*)|\/(?:about|blog)\/)$/ .test(href)) node.setAttribute('href', href);
  };
  const setExternalLink = (node, href) => {
    const safeHref = safeHttps(href);
    if (!node || !safeHref) return;
    node.setAttribute('href', safeHref);
    node.setAttribute('rel', 'noreferrer');
  };

  function validSite(data) {
    if (!isRecord(data) || data.schemaVersion !== 1 || !/^[a-z]{2}(?:-[A-Z]{2})?$/.test(data.locale || '') || !['ltr', 'rtl'].includes(data.direction)) return false;
    if (!isRecord(data.site) || !isRecord(data.labels) || !isRecord(data.hero) || !isRecord(data.about) || !isRecord(data.experience) || !isRecord(data.projects) || !isRecord(data.blog) || !isRecord(data.professionalDevelopment) || !isRecord(data.contact)) return false;
    if (!isText(data.site.name) || !isText(data.site.person) || !isText(data.site.title) || !isText(data.site.description)) return false;
    if (!Array.isArray(data.navigation) || !data.navigation.every((item) => isRecord(item) && isText(item.label) && /^(?:#[a-z][a-z0-9-]*|\/(?:about|blog)\/)$/.test(item.href))) return false;
    if (!['skipToContent', 'mainNavigation', 'technologies', 'toolsCount', 'readWriteup', 'repository', 'backToTop', 'backToWork', 'home'].every((key) => isText(data.labels[key]))) return false;
    if (!data.labels.toolsCount.includes('{count}')) return false;
    if (!['eyebrow', 'title', 'highlight', 'description', 'primaryAction', 'secondaryAction'].every((key) => isText(data.hero[key]))) return false;
    if (data.hero.secondaryHref !== '/about/') return false;
    const aboutIcons = ['server', 'shield', 'lightbulb', 'route'];
    if (!isText(data.about.title) || !isText(data.about.description) || !isText(data.about.whyHeading) || !isText(data.about.whyText) || !Array.isArray(data.about.points) || data.about.points.length < 1 || data.about.points.length > 6 || !data.about.points.every((point) => isRecord(point) && aboutIcons.includes(point.icon) && isText(point.text))) return false;
    if (!isText(data.experience.eyebrow) || !isText(data.experience.title) || !Array.isArray(data.experience.entries) || !data.experience.entries.every((entry) => isRecord(entry) && isText(entry.label) && isText(entry.duration) && isText(entry.heading))) return false;
    if (!isText(data.projects.eyebrow) || !isText(data.projects.title) || !isText(data.projects.description)) return false;
    if (!isText(data.blog.eyebrow) || !isText(data.blog.title) || !isText(data.blog.description)) return false;
    if (!isText(data.professionalDevelopment.title) || !Array.isArray(data.professionalDevelopment.credentials) || !data.professionalDevelopment.credentials.every((entry) => isRecord(entry) && isText(entry.mark) && isText(entry.name) && isText(entry.detail) && (entry.url === undefined || Boolean(safeHttps(entry.url)))) || !Array.isArray(data.professionalDevelopment.toolCategories) || !data.professionalDevelopment.toolCategories.every((group) => isRecord(group) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(group.id || '') && isText(group.name) && Array.isArray(group.tools) && group.tools.every(isText))) return false;
    if (!isText(data.contact.eyebrow) || !isText(data.contact.title) || !isText(data.contact.highlight) || !isText(data.contact.description) || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.contact.email || '') || !safeHttps(data.contact.githubUrl) || !safeHttps(data.contact.linkedinUrl) || !safeHttps(data.contact.keybaseUrl)) return false;
    return isText(data.footer);
  }

  function validProjects(data, locale) {
    if (!isRecord(data) || data.schemaVersion !== 1 || data.locale !== locale || !Array.isArray(data.items)) return false;
    return data.items.every((item) => isRecord(item)
      && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id || '')
      && item.slug === item.id
      && item.url === `/projects/${item.id}.html`
      && isText(item.title) && isText(item.summary) && isText(item.status)
      && Array.isArray(item.tags) && item.tags.every(isText)
      && (item.externalUrl === '' || Boolean(safeHttps(item.externalUrl)))
      && isText(item.writeupMarkdown));
  }

  function validBlog(data, locale) {
    if (!isRecord(data) || data.schemaVersion !== 1 || data.locale !== locale || !Array.isArray(data.items) || data.items.length === 0) return false;
    return data.items.every((item) => isRecord(item)
      && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug || '')
      && item.url === `/blog/${item.slug}/`
      && isText(item.title) && isText(item.metaTitle) && item.metaTitle.length <= 60
      && isText(item.metaDescription) && item.metaDescription.length <= 155
      && isText(item.summary) && isText(item.keyTakeaway) && isText(item.author)
      && isText(item.category) && /^\d{4}-\d{2}-\d{2}$/.test(item.publishedAt || '')
      && Number.isInteger(item.readingTimeMinutes) && item.readingTimeMinutes >= 1
      && Array.isArray(item.tags) && item.tags.length >= 4 && item.tags.length <= 5 && item.tags.every(isText)
      && isText(item.bodyMarkdown)
      && isRecord(item.visual) && isText(item.visual.title) && isText(item.visual.caption)
      && Array.isArray(item.visual.steps) && item.visual.steps.length >= 3 && item.visual.steps.length <= 8
      && item.visual.steps.every((step) => isRecord(step) && isText(step.label) && isText(step.detail))
      && isRecord(item.schema) && isText(item.schema.title) && isText(item.schema.caption)
      && (item.schema.joinLabel === undefined || isText(item.schema.joinLabel))
      && Array.isArray(item.schema.standards) && item.schema.standards.length >= 2 && item.schema.standards.length <= 3
      && item.schema.standards.every((standard) => isRecord(standard) && isText(standard.name)
        && Array.isArray(standard.fields) && standard.fields.length >= 3 && standard.fields.length <= 8
        && standard.fields.every((field) => isRecord(field) && isText(field.name) && isText(field.meaning)))
      && isRecord(item.schema.output) && isText(item.schema.output.name)
      && Array.isArray(item.schema.output.fields) && item.schema.output.fields.length >= 2 && item.schema.output.fields.length <= 8
      && item.schema.output.fields.every(isText));
  }

  async function fetchJson(path) {
    const response = await fetch(path, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-cache',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
    return response.json();
  }

  function renderNavigation(container, site, projectPrefix = '') {
    const links = site.navigation.map((item) => {
      const link = make('a', item.href === '#contact' ? 'nav-contact' : '', item.label);
      const href = projectPrefix && item.href.startsWith('#') ? `${projectPrefix}${item.href}` : item.href;
      setLink(link, href);
      return link;
    });
    container.replaceChildren(...links);
  }

  function renderSideNavigation(container, site) {
    if (!container) return;
    const links = site.navigation.map((item) => {
      const link = make('a', '', item.label);
      const href = item.href.startsWith('#') ? `/${item.href}` : item.href;
      setLink(link, href);
      return link;
    });
    container.replaceChildren(...links);
  }

  function makeSocialIcon(name) {
    const image = document.createElement('img');
    image.src = `/assets/icons/${name}.svg`;
    image.alt = '';
    image.width = 24;
    image.height = 24;
    image.decoding = 'async';
    image.setAttribute('aria-hidden', 'true');
    return image;
  }

  function renderSocialLinks(container, site) {
    if (!container) return;
    const entries = [
      ['linkedin', 'LinkedIn', site.contact.linkedinUrl],
      ['email', 'Email', `mailto:${site.contact.email}?subject=${encodeURIComponent(site.contact.emailSubject)}`],
      ['github', 'GitHub', site.contact.githubUrl],
      ['keybase', 'Keybase', site.contact.keybaseUrl]
    ];
    const links = entries.map(([icon, label, href]) => {
      if (icon !== 'email' && !safeHttps(href)) return null;
      const link = make('a', `social-icon-link social-icon-${icon}`);
      link.setAttribute('href', href);
      link.setAttribute('aria-label', label);
      link.setAttribute('title', label);
      if (icon !== 'email') link.setAttribute('rel', 'noreferrer');
      link.append(makeSocialIcon(icon));
      return link;
    }).filter(Boolean);
    container.replaceChildren(...links);
  }

  function setupSideNavigator() {
    const navigator = document.querySelector('[data-side-navigator]');
    if (!navigator) return;
    navigator.addEventListener('click', (event) => {
      if (event.target.closest('.side-navigator-panel a')) navigator.open = false;
    });
    navigator.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navigator.open) {
        navigator.open = false;
        navigator.querySelector('summary')?.focus();
      }
    });
  }

  function renderExperience(container, content) {
    const entries = content.experience.entries.map((entry) => {
      if (!isRecord(entry) || !isText(entry.label) || !isText(entry.duration) || !isText(entry.heading)) return null;
      const item = make('li', 'timeline-entry');
      const head = make('div', 'experience-card-head');
      head.append(make('p', 'entry-meta', entry.label), make('span', 'experience-duration', entry.duration));
      const body = make('div', 'timeline-content');
      body.append(make('h3', '', entry.heading));
      if (isText(entry.description)) body.append(make('p', '', entry.description));
      if (Array.isArray(entry.outcomes)) {
        const grid = make('div', 'evidence-grid');
        grid.setAttribute('aria-label', entry.label);
        for (const outcome of entry.outcomes) {
          if (!isRecord(outcome) || !isText(outcome.metric) || !isText(outcome.description)) continue;
          const card = make('article', 'evidence-card');
          card.append(make('strong', '', outcome.metric), make('p', '', outcome.description));
          grid.append(card);
        }
        if (grid.childElementCount) body.append(grid);
      }
      item.append(head, body);
      return item;
    }).filter(Boolean);
    if (container) container.replaceChildren(...entries);
  }

  function renderAbout(container, content) {
    if (!container) return;
    const list = make('ul', 'about-point-list');
    for (const point of content.points) {
      const item = make('li');
      const icon = makeIcon(point.icon, `about-point-icon icon-${point.icon}`);
      item.append(icon, make('p', '', point.text));
      list.append(item);
    }
    const why = make('section', 'about-why');
    why.setAttribute('aria-labelledby', 'about-why-title');
    const heading = make('h2', '', content.whyHeading);
    heading.id = 'about-why-title';
    const copy = make('div', 'about-why-copy');
    for (const paragraph of content.whyText.split(/\n\s*\n/)) copy.append(make('p', '', paragraph));
    why.append(heading, copy);
    container.replaceChildren(list, why);
  }

  function renderProjects(container, content, labels) {
    const cards = content.items.map((project) => {
      const card = make('article', 'project-card');
      const iconName = project.id === 'pid-integrity' ? 'network' : project.id === 'telemetry-engineering' ? 'layers' : 'cloud';
      card.append(makeIcon(iconName));
      card.append(make('span', 'project-status', project.status), make('h3', '', project.title), make('p', '', project.summary));
      const actions = make('div', 'project-actions');
      const detail = make('a', '', labels.readWriteup);
      detail.setAttribute('href', project.url);
      actions.append(detail);
      const externalHref = safeHttps(project.externalUrl);
      if (externalHref) {
        const external = make('a', '', labels.repository);
        external.setAttribute('href', externalHref);
        external.setAttribute('rel', 'noreferrer');
        actions.append(external);
      }
      card.append(actions);
      return card;
    });
    container.replaceChildren(...cards);
  }

  function renderBlog(container, posts) {
    if (!container) return;
    const cards = posts.slice(0, 3).map((post) => {
      const card = make('article', 'blog-card');
      card.append(make('p', 'blog-card-label', `${post.category} · ${post.publishedAt} · ${post.readingTimeMinutes} min read`), make('h3', '', post.title), make('p', '', post.summary));
      const tagList = make('div', 'blog-card-tags');
      for (const tag of post.tags) tagList.append(make('span', '', tag));
      const link = make('a', '', 'Read article →');
      link.setAttribute('href', post.url);
      card.append(tagList);
      card.append(link);
      return card;
    });
    container.replaceChildren(...cards);
  }

  function renderBlogIndex(container, posts) {
    if (!container) return;
    const cards = posts.map((post) => {
      const card = make('article', 'blog-card');
      card.setAttribute('data-blog-card', '');
      card.setAttribute('data-search-text', [post.title, post.summary, post.category, ...post.tags].join(' ').toLocaleLowerCase());
      card.setAttribute('data-search-tags', post.tags.join(' '));
      card.append(make('p', 'blog-card-label', `${post.category} · ${post.publishedAt} · ${post.readingTimeMinutes} min read`));
      const heading = make('h2');
      const title = make('a', '', post.title);
      title.setAttribute('href', post.url);
      heading.append(title);
      card.append(heading, make('p', '', post.summary));
      const tags = make('div', 'blog-card-tags');
      for (const tag of post.tags) tags.append(make('span', '', tag));
      card.append(tags);
      const link = make('a', 'blog-read-link', 'Read article →');
      link.setAttribute('href', post.url);
      card.append(link);
      return card;
    });
    container.replaceChildren(...cards);
  }

  function setupBlogSearch(page) {
    if (!page) return;
    const input = page.querySelector('[data-blog-search]');
    const list = page.querySelector('[data-blog-list]');
    if (!input || !list || page.dataset.searchReady === 'true') return;
    page.dataset.searchReady = 'true';
    const count = page.querySelector('[data-blog-count]');
    const empty = page.querySelector('[data-blog-empty]');
    const normalize = (value) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
    const update = () => {
      const terms = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
      let visible = 0;
      for (const card of list.querySelectorAll('[data-blog-card]')) {
        const searchable = normalize(`${card.getAttribute('data-search-text') || ''} ${card.getAttribute('data-search-tags') || ''}`);
        const show = terms.length === 0 || terms.every((term) => searchable.includes(term));
        card.hidden = !show;
        if (show) visible += 1;
      }
      if (count) count.textContent = `${visible} ${visible === 1 ? 'article' : 'articles'}`;
      if (empty) empty.hidden = visible !== 0;
    };
    input.addEventListener('input', update);
    update();
  }

  function setupTerminalCopy() {
    document.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-copy-terminal]');
      if (!button) return;
      const code = button.closest('.terminal-block')?.querySelector('pre code');
      if (!code) return;
      let copied = false;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(code.textContent);
        copied = true;
      } catch {
        const field = make('textarea');
        field.value = code.textContent;
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.append(field);
        field.select();
        copied = document.execCommand('copy');
        field.remove();
      }
      button.textContent = copied ? 'Copied' : 'Select code';
      window.setTimeout(() => { button.textContent = 'Copy'; }, 1400);
    });
  }

  function renderBlogInfographics(post) {
    const section = make('section', 'article-visuals');
    section.setAttribute('data-blog-infographics', '');
    section.setAttribute('aria-label', 'Article visuals');

    const processFigure = make('figure', 'article-visual-card');
    const processCaption = make('figcaption');
    processCaption.append(make('p', 'eyebrow', 'At a glance'), make('h2', '', post.visual.title), make('p', '', post.visual.caption));
    const flow = make('ol', 'process-flow');
    post.visual.steps.forEach((step, index) => {
      const item = make('li', 'process-step');
      item.append(make('strong', '', step.label), make('p', '', step.detail));
      flow.append(item);
    });
    processFigure.append(processCaption, flow);

    const schemaFigure = make('figure', 'article-visual-card schema-card');
    const schemaCaption = make('figcaption');
    schemaCaption.append(make('p', 'eyebrow', 'At a glance'), make('h2', '', post.schema.title), make('p', '', post.schema.caption));
    const schemaFlow = make('div', 'schema-flow');
    const standards = make('div', 'schema-standards');
    for (const standard of post.schema.standards) {
      const card = make('article', 'schema-standard');
      card.append(make('h3', '', standard.name));
      const list = make('dl');
      for (const field of standard.fields) {
        const row = make('div');
        row.append(make('dt', '', field.name), make('dd', '', field.meaning));
        list.append(row);
      }
      card.append(list);
      standards.append(card);
    }
    const connector = make('div', 'schema-connector');
    connector.append(make('span', '', post.schema.joinLabel || 'fields map to'), make('b', '', '→'));
    connector.setAttribute('aria-hidden', 'true');
    const output = make('article', 'schema-output');
    output.append(make('h3', '', post.schema.output.name));
    const fields = make('ul');
    for (const field of post.schema.output.fields) fields.append(make('li', '', field));
    output.append(fields);
    schemaFlow.append(standards, connector, output);
    schemaFigure.append(schemaCaption, schemaFlow);
    section.append(processFigure, schemaFigure);
    return section;
  }

  function renderCredentials(container, content) {
    const entries = content.professionalDevelopment.credentials.map((item) => {
      if (!isRecord(item) || !isText(item.mark) || !isText(item.name) || !isText(item.detail)) return null;
      const hasProfile = Boolean(item.url && safeHttps(item.url));
      const card = make(hasProfile ? 'a' : 'article', hasProfile ? 'credential credential-link-card' : 'credential');
      if (hasProfile) {
        card.setAttribute('href', safeHttps(item.url));
        card.setAttribute('rel', 'noreferrer');
        card.setAttribute('aria-label', `Open official verification page for ${item.name}`);
      }
      const copy = make('div');
      const heading = make('h3', '', item.name);
      copy.append(heading, make('p', '', item.detail));
      card.append(make('span', 'credential-mark', item.mark), copy);
      return card;
    }).filter(Boolean);
    container.replaceChildren(...entries);
  }

  function renderTools(container, content, labels) {
    const groups = content.professionalDevelopment.toolCategories.map((category, index) => {
      if (!isRecord(category) || !isText(category.id) || !isText(category.name) || !Array.isArray(category.tools)) return null;
      const card = make('article', 'tool-category');
      card.setAttribute('data-category', category.id);
      const heading = make('div', 'tool-card-heading');
      const count = isText(labels.toolsCount) ? labels.toolsCount.replace('{count}', String(category.tools.length)) : String(category.tools.length);
      const iconName = category.id === 'detection-siem' ? 'pulse' : category.id === 'telemetry-cloud' ? 'cloud' : 'shield';
      heading.append(make('span', 'tool-index', String(index + 1).padStart(2, '0')), makeIcon(iconName, 'tool-icon'), make('h3', '', category.name), make('span', 'tool-count', count));
      const list = make('ul', 'tool-chip-list');
      list.setAttribute('aria-label', category.name);
      for (const tool of category.tools) if (isText(tool)) list.append(make('li', '', tool));
      card.append(heading, list);
      return card;
    }).filter(Boolean);
    container.replaceChildren(...groups);
  }

  function renderInline(text) {
    const fragment = document.createDocumentFragment();
    const pattern = /\[([^\]]+)\]\(([^\s)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*/g;
    let cursor = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      fragment.append(document.createTextNode(text.slice(cursor, match.index)));
      if (match[1] !== undefined) {
        const href = safeHttps(match[2]);
        if (href) {
          const link = make('a', '', match[1]);
          link.setAttribute('href', href);
          link.setAttribute('rel', 'noreferrer');
          fragment.append(link);
        } else fragment.append(document.createTextNode(match[0]));
      } else if (match[3] !== undefined) fragment.append(make('code', '', match[3]));
      else fragment.append(make('strong', '', match[4]));
      cursor = pattern.lastIndex;
    }
    fragment.append(document.createTextNode(text.slice(cursor)));
    return fragment;
  }

  function renderMarkdown(markdown, headingOffset = 1) {
    const fragment = document.createDocumentFragment();
    const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i += 1; continue; }
      if (line.startsWith('```')) {
        const language = line.slice(3).trim().replace(/[^a-z0-9_-]/gi, '') || 'text';
        const codeLines = [];
        i += 1;
        while (i < lines.length && !lines[i].startsWith('```')) codeLines.push(lines[i++]);
        if (i < lines.length) i += 1;
        const terminal = make('div', 'terminal-block');
        const toolbar = make('div', 'terminal-toolbar');
        const lights = make('span', 'terminal-lights');
        lights.setAttribute('aria-hidden', 'true');
        lights.append(make('i'), make('i'), make('i'));
        toolbar.append(lights, make('span', 'terminal-language', language));
        const copy = make('button', 'terminal-copy', 'Copy');
        copy.type = 'button';
        copy.setAttribute('data-copy-terminal', '');
        toolbar.append(copy);
        const pre = make('pre');
        pre.append(make('code', `language-${language}`, codeLines.join('\n')));
        terminal.append(toolbar, pre);
        fragment.append(terminal);
        continue;
      }
      const widget = /^<!-- INSERT_DYNAMIC_WIDGET: ([a-z][a-z0-9_-]*) -->$/.exec(line.trim());
      if (widget) {
        const slot = make('aside', 'widget-slot');
        slot.setAttribute('data-widget-slot', widget[1]);
        slot.setAttribute('aria-label', widget[1].replaceAll('_', ' '));
        fragment.append(slot);
        i += 1;
        continue;
      }
      if (/^\|.*\|$/.test(line) && i + 1 < lines.length && /^\|?\s*:?-{3,}/.test(lines[i + 1])) {
        const cells = (value) => value.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((cell) => cell.trim().replaceAll('\\|', '|'));
        const headers = cells(line);
        const rows = [];
        i += 2;
        while (i < lines.length && /^\|.*\|$/.test(lines[i])) rows.push(cells(lines[i++]));
        const wrap = make('div', 'table-scroll');
        const table = make('table');
        const thead = make('thead');
        const headRow = make('tr');
        for (const label of headers) {
          const cell = make('th', '', label);
          cell.setAttribute('scope', 'col');
          headRow.append(cell);
        }
        thead.append(headRow);
        const tbody = make('tbody');
        for (const row of rows) {
          const tr = make('tr');
          headers.forEach((_, index) => {
            const td = make('td');
            td.append(renderInline(row[index] || ''));
            tr.append(td);
          });
          tbody.append(tr);
        }
        table.append(thead, tbody);
        wrap.append(table);
        fragment.append(wrap);
        continue;
      }
      if (/^>\s?/.test(line)) {
        const quote = make('blockquote', 'key-takeaway');
        const text = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) text.push(lines[i++].replace(/^>\s?/, '').trim());
        const paragraph = make('p');
        paragraph.append(renderInline(text.join(' ')));
        quote.append(paragraph);
        fragment.append(quote);
        continue;
      }
      const heading = /^(#{1,3})\s+(.+)$/.exec(line);
      if (heading) {
        const node = make(`h${Math.min(heading[1].length + headingOffset, 4)}`);
        node.append(renderInline(heading[2]));
        fragment.append(node);
        i += 1;
        continue;
      }
      if (/^\s*[-*]\s+/.test(line)) {
        const list = make('ul');
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          const item = make('li');
          item.append(renderInline(lines[i].replace(/^\s*[-*]\s+/, '')));
          list.append(item);
          i += 1;
        }
        fragment.append(list);
        continue;
      }
      if (/^\s*\d+\.\s+/.test(line)) {
        const list = make('ol');
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          const item = make('li');
          item.append(renderInline(lines[i].replace(/^\s*\d+\.\s+/, '')));
          list.append(item);
          i += 1;
        }
        fragment.append(list);
        continue;
      }
      const paragraph = [line.trim()];
      i += 1;
      while (i < lines.length && lines[i].trim() && !/^(#{1,3})\s+/.test(lines[i]) && !lines[i].startsWith('```') && !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i])) paragraph.push(lines[i++].trim());
      const p = make('p');
      p.append(renderInline(paragraph.join(' ')));
      fragment.append(p);
    }
    return fragment;
  }

  function hydrateHome(site, projects, blog) {
    const root = document.querySelector('[data-home-content]');
    if (!root) return;
    document.documentElement.lang = site.locale;
    document.documentElement.dir = site.direction;
    document.title = site.site.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', site.site.description);
    setText('.brand-name', site.site.name);
    setText('.brand-byline', `${site.site.person} · Security Engineering`);
    const brand = document.querySelector('.brand');
    if (brand) brand.setAttribute('aria-label', `${site.site.name} — ${site.site.person}, home`);
    setText('[data-bind="hero.eyebrow"]', site.hero.eyebrow, root);
    setText('[data-bind="hero.title"]', site.hero.title, root);
    setText('[data-bind="hero.highlight"]', site.hero.highlight, root);
    setText('[data-bind="hero.description"]', site.hero.description, root);
    setText('[data-bind="hero.primaryAction"]', site.hero.primaryAction, root);
    setText('[data-bind="hero.secondaryAction"]', site.hero.secondaryAction, root);
    setText('[data-bind="experience.eyebrow"]', site.experience.eyebrow, root);
    setText('[data-bind="experience.title"]', site.experience.title, root);
    setText('[data-bind="projects.eyebrow"]', site.projects.eyebrow, root);
    setText('[data-bind="projects.title"]', site.projects.title, root);
    setText('[data-bind="projects.description"]', site.projects.description, root);
    setText('[data-bind="blog.eyebrow"]', site.blog.eyebrow, root);
    setText('[data-bind="blog.title"]', site.blog.title, root);
    setText('[data-bind="blog.description"]', site.blog.description, root);
    setText('[data-bind="professionalDevelopment.title"]', site.professionalDevelopment.title, root);
    setText('[data-bind="contact.eyebrow"]', site.contact.eyebrow, root);
    setText('[data-bind="contact.title"]', site.contact.title, root);
    setText('[data-bind="contact.highlight"]', site.contact.highlight, root);
    setText('[data-bind="contact.description"]', site.contact.description, root);
    setText('[data-bind="contact.emailLabel"]', site.contact.emailLabel, root);
    setText('[data-bind="contact.githubLabel"]', site.contact.githubLabel, root);
    setText('[data-bind="footer"]', site.footer, root);
    const skip = document.querySelector('.skip-link');
    if (skip) skip.textContent = site.labels.skipToContent;
    const nav = document.querySelector('[data-content-nav]');
    if (nav) {
      nav.setAttribute('aria-label', site.labels.mainNavigation);
      renderNavigation(nav, site);
    }
    renderSideNavigation(document.querySelector('[data-content-side-links]'), site);
    renderExperience(root.querySelector('[data-content-experience]'), site);
    renderProjects(root.querySelector('[data-content-projects]'), projects, site.labels);
    renderBlog(root.querySelector('[data-content-blog]'), blog.items);
    renderCredentials(root.querySelector('[data-content-credentials]'), site);
    renderTools(root.querySelector('[data-content-tools]'), site, site.labels);
    setLink(root.querySelector('[data-bind="hero.primaryAction"]'), '#work');
    setLink(root.querySelector('[data-bind="hero.secondaryAction"]'), site.hero.secondaryHref);
    const emailLink = root.querySelector('[data-bind="contact.emailLabel"]');
    if (emailLink) emailLink.setAttribute('href', `mailto:${site.contact.email}?subject=${encodeURIComponent(site.contact.emailSubject)}`);
    setExternalLink(root.querySelector('[data-bind="contact.githubLabel"]'), site.contact.githubUrl);
    setText('[data-bind="labels.backToTop"]', site.labels.backToTop);
  }

  function hydrateAboutPage(site) {
    const page = document.querySelector('[data-about-page]');
    if (!page) return;
    document.documentElement.lang = site.locale;
    document.documentElement.dir = site.direction;
    document.title = `${site.about.title} — ${site.site.name}`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', site.about.description);
    setText('.brand-name', site.site.name);
    setText('.brand-byline', `${site.site.person} · Security Engineering`);
    const brand = document.querySelector('.brand');
    if (brand) brand.setAttribute('aria-label', `${site.site.name} — ${site.site.person}, home`);
    setText('[data-bind="about.title"]', site.about.title, page);
    renderAbout(page.querySelector('[data-content-about]'), site.about);
    const skip = document.querySelector('.skip-link');
    if (skip) skip.textContent = site.labels.skipToContent;
    const nav = document.querySelector('[data-content-nav]');
    if (nav) {
      nav.setAttribute('aria-label', site.labels.mainNavigation);
      renderNavigation(nav, site, '/');
    }
    renderSideNavigation(document.querySelector('[data-content-side-links]'), site);
    setText('[data-bind="footer"]', site.footer);
  }

  function hydrateBlogIndex(site, blog) {
    const page = document.querySelector('[data-blog-index]');
    if (!page) return;
    document.documentElement.lang = site.locale;
    document.documentElement.dir = site.direction;
    const title = `${site.blog.title} — ${site.site.name}`;
    document.title = title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', site.blog.description);
    const nav = document.querySelector('[data-content-nav]');
    if (nav) {
      nav.setAttribute('aria-label', site.labels.mainNavigation);
      renderNavigation(nav, site, '/');
    }
    renderSideNavigation(document.querySelector('[data-content-side-links]'), site);
    renderBlogIndex(page.querySelector('[data-blog-list]'), blog.items);
    const skip = document.querySelector('.skip-link');
    if (skip) skip.textContent = site.labels.skipToContent;
  }

  function hydrateBlogPost(site, blog) {
    const page = document.querySelector('[data-blog-page]');
    if (!page) return;
    const slug = page.getAttribute('data-blog-page');
    const post = blog.items.find((item) => item.slug === slug);
    if (!post) return;
    document.documentElement.lang = site.locale;
    document.documentElement.dir = site.direction;
    document.title = post.metaTitle;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', post.metaDescription);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', post.metaTitle);
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute('content', post.metaDescription);
    const nav = document.querySelector('[data-content-nav]');
    if (nav) {
      nav.setAttribute('aria-label', site.labels.mainNavigation);
      renderNavigation(nav, site, '/');
    }
    renderSideNavigation(document.querySelector('[data-content-side-links]'), site);
    setText('[data-bind="blog.category"]', post.category, page);
    setText('[data-bind="blog.title"]', post.title, page);
    setText('[data-bind="blog.summary"]', post.summary, page);
    setText('[data-bind="blog.author"]', post.author, page);
    setText('[data-bind="blog.takeaway"]', post.keyTakeaway, page);
    setText('[data-bind="blog.readingTime"]', `${post.readingTimeMinutes} min read`, page);
    const date = page.querySelector('[data-bind="blog.date"]');
    if (date) { date.dateTime = post.publishedAt; date.textContent = post.publishedAt; }
    const updated = page.querySelector('.article-footer time');
    if (updated) { updated.dateTime = post.updatedAt || post.publishedAt; updated.textContent = post.updatedAt || post.publishedAt; }
    const tags = page.querySelector('[data-bind="blog.tags"]');
    if (tags) tags.replaceChildren(...post.tags.map((tag) => make('span', '', tag)));
    const infographics = page.querySelector('[data-blog-infographics]');
    if (infographics) infographics.replaceWith(renderBlogInfographics(post));
    const body = page.querySelector('[data-bind="blog.body"]');
    if (body) body.replaceChildren(renderMarkdown(post.bodyMarkdown, 0));
  }

  function hydrateProject(site, projects) {
    const page = document.querySelector('[data-project-page]');
    if (!page) return;
    const slug = page.getAttribute('data-project-page');
    const project = projects.items.find((item) => item.slug === slug);
    if (!project) return;
    document.documentElement.lang = site.locale;
    document.documentElement.dir = site.direction;
    document.title = `${project.title} — ${site.site.name}`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', project.summary);
    setText('.brand-name', site.site.name);
    setText('.brand-byline', `${site.site.person} · Security Engineering`);
    const brand = document.querySelector('.brand');
    if (brand) brand.setAttribute('aria-label', `${site.site.name} — ${site.site.person}, home`);
    const skip = document.querySelector('.skip-link');
    if (skip) skip.textContent = site.labels.skipToContent;
    const nav = document.querySelector('[data-content-nav]');
    if (nav) {
      nav.setAttribute('aria-label', site.labels.mainNavigation);
      renderNavigation(nav, site, '/');
    }
    renderSideNavigation(document.querySelector('[data-content-side-links]'), site);
    setText('[data-bind="project.title"]', project.title, page);
    setText('[data-bind="project.status"]', project.status, page);
    setText('[data-bind="project.summary"]', project.summary, page);
    const workLink = page.querySelector('[data-bind="project.workLabel"]');
    if (workLink) workLink.textContent = site.labels.backToWork;
    setText('[data-bind="labels.backToWork"]', site.labels.backToWork, page);
    const tags = page.querySelector('[data-bind="project.tags"]');
    if (tags) tags.replaceChildren(...project.tags.map((tag) => make('span', '', tag)));
    const article = page.querySelector('[data-bind="project.writeup"]');
    if (article) article.replaceChildren(renderMarkdown(project.writeupMarkdown));
    setText('[data-bind="footer"]', site.footer);
    setText('[data-bind="labels.home"]', site.labels.home);
  }

  async function hydrate() {
    try {
      const [site, projects, blog] = await Promise.all([fetchJson('/content/site.json'), fetchJson('/content/projects.json'), fetchJson('/content/blog.json')]);
      if (!validSite(site) || !validProjects(projects, site.locale) || !validBlog(blog, site.locale)) return;
      const messageShortcut = document.querySelector('[data-message-shortcut]');
      if (messageShortcut) {
        messageShortcut.setAttribute('href', `mailto:${site.contact.email}?subject=${encodeURIComponent(site.contact.emailSubject)}`);
        messageShortcut.setAttribute('aria-label', `Send email to ${site.contact.email}`);
      }
      renderSocialLinks(document.querySelector('[data-social-links]'), site);
      hydrateHome(site, projects, blog);
      hydrateAboutPage(site);
      hydrateProject(site, projects);
      hydrateBlogIndex(site, blog);
      hydrateBlogPost(site, blog);
    } catch {
      // The server-rendered HTML stays available when content cannot be refreshed.
    }
  }

  setupSideNavigator();
  setupBlogSearch(document.querySelector('[data-blog-index]'));
  setupTerminalCopy();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hydrate, { once: true });
  else hydrate();
})();
