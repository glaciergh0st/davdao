```json
{
  "title": "Article title",
  "metaTitle": "Search title, no more than 60 characters",
  "metaDescription": "A useful description, no more than 155 characters.",
  "slug": "article-slug",
  "openGraphImagePrompt": "Editorial visual description; no logos or text.",
  "tags": ["Entity one", "Entity two", "Entity three", "Entity four"],
  "keyTakeaway": "A direct first sentence. A second sentence that completes the main point.",
  "visual": {
    "title": "Title for a visual that explains the article's main idea",
    "caption": "One sentence telling readers what to notice.",
    "steps": [
      { "label": "Step or entity one", "detail": "What it represents." },
      { "label": "Step or entity two", "detail": "How it relates to the first." },
      { "label": "Step or entity three", "detail": "What happens next." }
    ]
  },
  "schema": {
    "title": "Title for the data or relationship schema",
    "caption": "Explain the relationship or field contract in one sentence.",
    "standards": [
      {
        "name": "Schema or entity one",
        "fields": [
          { "name": "field.one", "meaning": "What the field represents." },
          { "name": "field.two", "meaning": "What the field represents." },
          { "name": "field.three", "meaning": "What the field represents." }
        ]
      },
      {
        "name": "Schema or entity two",
        "fields": [
          { "name": "field.one", "meaning": "What the field represents." },
          { "name": "field.two", "meaning": "What the field represents." },
          { "name": "field.three", "meaning": "What the field represents." }
        ]
      }
    ],
    "output": {
      "name": "The resulting record or entity",
      "fields": ["entity", "evidence"]
    }
  },
  "summary": "A plain-language summary used on article cards.",
  "author": "David Awosusi",
  "category": "Detection Engineering",
  "publishedAt": "YYYY-MM-DD",
  "updatedAt": "YYYY-MM-DD"
}
```

## First section

Write the article in Markdown. Use H2 for main sections and H3 for subsections.

## References

- [Source title](https://example.com/)
