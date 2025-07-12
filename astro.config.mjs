import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import mermaid from 'astro-mermaid'; //

import remarkToc from 'remark-toc';
import remarkAutolinkHeadings from 'remark-autolink-headings';
import rehypeSlug from 'rehype-slug';

export default defineConfig({
  site: 'https://davdao.com',
  integrations: [
    mdx({
      remarkPlugins: [
        [remarkToc, { heading: 'Table of Contents', maxDepth: 3 }],
        remarkAutolinkHeadings
      ],
      rehypePlugins: [rehypeSlug],
    }),
    sitemap(),
    mermaid() // 
  ],
});
