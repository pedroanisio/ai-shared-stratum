# Document Metadata Envelope Schema

**Version:** 1.1  
**Schema ID:** `https://vera.example.com/schemas/document-metadata-v1.1.json`  
**JSON Schema Draft:** 2020-12

A standardized metadata wrapper for documents, APIs, ML models, configurations, datasets, prompts, templates, and other digital artifacts.

---

## Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Schema Structure](#schema-structure)
4. [Document Organization](#document-organization)
5. [Design Decisions](#design-decisions)
6. [Usage Examples](#usage-examples)
7. [Validation Rules](#validation-rules)
8. [Extension Points](#extension-points)

---

## Overview

The Document Metadata Envelope provides a consistent way to describe and organize digital artifacts across an organization. It separates **metadata** (who, when, what) from **content** (the actual document material), enabling:

- Consistent discovery and indexing across heterogeneous artifact types
- Clear ownership and lifecycle management
- Flexible document organization patterns
- Dependency tracking between artifacts
- Content integrity verification

### Key Principles

1. **Sections are atomic** — Every document is built from sections, regardless of complexity
2. **Single organization pattern** — Choose one hierarchy per document, no mixing
3. **Metadata is required** — Core fields ensure every artifact is identifiable and traceable
4. **Content is external** — Sections reference content via `contentRef`, keeping metadata lightweight

---

## Core Concepts

### Sections: The Building Block

Sections are the fundamental unit. A simple document may be a single section containing all content. A complex book may have hundreds of sections organized into chapters and parts. Every new document starts with a required placeholder section (e.g., `Blank...`) to satisfy the schema's minimum section requirement.

```json
{
  "sections": [
    {
      "id": "intro",
      "title": "Introduction",
      "number": 1,
      "contentRef": "./content/introduction.md",
      "mediaType": "text/markdown"
    }
  ]
}
```

Every section must have:
- `id` — Unique identifier within the document
- `title` — Human-readable name (used in TOC generation)
- `contentRef` — Path or URI to the actual content

### Document Types

Four top-level classifications describe the artifact's nature:

| Type | Use Case |
|------|----------|
| `book` | Long-form monographs, manuals, comprehensive guides |
| `volume` | Collections, journal issues, anthology volumes |
| `article` | Standalone pieces, blog posts, journal articles |
| `paper` | Academic papers, white papers, RFCs, technical reports |

The document type is descriptive — it doesn't constrain which organization patterns are available.

### Organization Patterns

Documents declare exactly one organizational hierarchy:

| Pattern | Structure | Example Use |
|---------|-----------|-------------|
| `flat` | sections | README, short article |
| `chapters` | chapters → sections | Technical manual |
| `parts` | parts → sections | Multi-part guide |
| `chapters-parts` | chapters → parts → sections | Textbook with units |
| `parts-chapters` | parts → chapters → sections | Encyclopedia volume |

**Critical constraint:** You cannot mix patterns. A document using `chapters-parts` cannot have standalone parts at the root level — all parts must be nested within chapters.

---

## Schema Structure

### Required Fields

Every document envelope must include:

```json
{
  "id": "vera:doc:unique-identifier",
  "title": "Document Title",
  "version": "1.0.0",
  "namespace": "com.example.team",
  "documentType": "article",
  "organization": "flat",
  "sections": [...],
  "meta": {
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

### Numbering Styles

Documents can declare default numbering styles and override them per container:

```json
{
  "numbering": {
    "parts": "roman-upper",
    "chapters": "arabic",
    "sections": "arabic"
  },
  "parts": [
    { "id": "part-1", "title": "Foundations", "number": 1, "numbering": "roman-upper", "sections": ["sec-a"] }
  ]
}
```

### Identity Fields

| Field | Description | Constraints |
|-------|-------------|-------------|
| `id` | Unique persistent identifier | 1–512 chars |
| `title` | Primary human-readable title | 1–240 chars |
| `subtitle` | Optional tagline | Max 360 chars |
| `version` | Semantic version (SemVer 2.0) | Pattern-validated |
| `namespace` | Reverse-DNS ownership scope | Min 2 segments |
| `aliases` | Alternative identifiers | Unique strings |

### Metadata Block (`meta`)

| Field | Description | Required |
|-------|-------------|----------|
| `createdAt` | Initial creation timestamp | Yes |
| `updatedAt` | Last content change timestamp | Yes |
| `generatedAt` | Envelope generation timestamp | No |
| `expiresAt` | Expiration timestamp | No |
| `expirationAction` | Action on expiry: `notify`, `deprecate`, `archive`, `delete` | No |
| `lifecycle` | Current stage: `draft`, `proposed`, `active`, `deprecated`, `obsolete`, `archived`, `withdrawn` | No |
| `authors` | Original creators | No |
| `maintainers` | Current responsible parties | No |
| `keywords` | Search/discovery terms | No |
| `domains` | Business domains (e.g., `finance`, `healthcare`) | No |
| `tags` | UI-friendly labels (e.g., `internal`, `beta`) | No |
| `abstract` | Long-form summary (Markdown supported) | No |
| `source` | Primary source URI | No |
| `integrity` | Content hash (`algorithm` + `digest`) | No |
| `license` | SPDX identifier or contact | No |
| `revisionHistory` | Fine-grained audit trail | No |

### Dependencies

Track relationships to other artifacts:

```json
{
  "dependencies": [
    {
      "id": "vera:schema:base-types:v1",
      "relationship": "extends",
      "versionConstraint": "^1.0.0",
      "optional": false
    }
  ]
}
```

Relationship types:
- `requires` — Hard dependency
- `extends` — Builds upon
- `replaces` — Supersedes entirely
- `supersedes` — Newer version of
- `references` — Cites or links to
- `implements` — Realizes a specification

---

## Document Organization

### Flat (Sections Only)

Simplest structure — just sections at the root.

```json
{
  "documentType": "article",
  "organization": "flat",
  "sections": [
    { "id": "abstract", "title": "Abstract", "contentRef": "./abstract.md" },
    { "id": "body", "title": "Main Content", "contentRef": "./body.md" },
    { "id": "refs", "title": "References", "contentRef": "./references.md" }
  ]
}
```

### Chapters → Sections

```json
{
  "documentType": "book",
  "organization": "chapters",
  "sections": [
    { "id": "sec-1-1", "title": "Getting Started", "contentRef": "./ch1/getting-started.md" },
    { "id": "sec-1-2", "title": "Installation", "contentRef": "./ch1/installation.md" },
    { "id": "sec-2-1", "title": "Basic Usage", "contentRef": "./ch2/basic-usage.md" }
  ],
  "chapters": [
    { "id": "ch-1", "title": "Introduction", "number": 1, "sections": ["sec-1-1", "sec-1-2"] },
    { "id": "ch-2", "title": "Tutorial", "number": 2, "sections": ["sec-2-1"] }
  ]
}
```

### Parts → Sections

```json
{
  "documentType": "book",
  "organization": "parts",
  "sections": [
    { "id": "sec-a", "title": "Overview", "contentRef": "./part1/overview.md" },
    { "id": "sec-b", "title": "Deep Dive", "contentRef": "./part2/deep-dive.md" }
  ],
  "parts": [
    { "id": "part-1", "title": "Fundamentals", "number": 1, "sections": ["sec-a"] },
    { "id": "part-2", "title": "Advanced Topics", "number": 2, "sections": ["sec-b"] }
  ]
}
```

### Chapters → Parts → Sections

Chapters contain parts; parts contain section references.

```json
{
  "documentType": "book",
  "organization": "chapters-parts",
  "sections": [...],
  "parts": [
    { "id": "part-1a", "title": "Theory", "sections": ["sec-1", "sec-2"] },
    { "id": "part-1b", "title": "Practice", "sections": ["sec-3"] }
  ],
  "chapters": [
    { "id": "ch-1", "title": "Foundations", "parts": ["part-1a", "part-1b"] }
  ]
}
```

### Parts → Chapters → Sections

Parts contain chapters; chapters contain section references.

```json
{
  "documentType": "volume",
  "organization": "parts-chapters",
  "sections": [...],
  "chapters": [
    { "id": "ch-1", "title": "History", "sections": ["sec-1", "sec-2"] },
    { "id": "ch-2", "title": "Modern Era", "sections": ["sec-3"] }
  ],
  "parts": [
    { "id": "part-1", "title": "Background", "chapters": ["ch-1", "ch-2"] }
  ]
}
```

---

## Design Decisions

### Why sections are required and atomic

**Decision:** Every document must have at least the `sections` array, even if empty structural containers (chapters/parts) exist above them.

**Rationale:**
- Sections provide the universal anchor for TOC generation
- Content lives in sections, not containers — chapters and parts are organizational, not content-bearing
- Enables consistent tooling regardless of document complexity
- A "simple" document is just one section; complexity scales naturally

### Why organization patterns are mutually exclusive

**Decision:** Documents declare one `organization` value; the schema enforces that only valid containers are present.

**Rationale:**
- Mixing hierarchies (e.g., some chapters containing parts, others containing sections directly) creates ambiguous structures
- Tooling can reliably traverse documents knowing the pattern
- Authors make an explicit architectural choice upfront
- Validation is enforceable at schema level

### Why `documentType` doesn't constrain organization

**Decision:** An `article` can use `chapters` organization; a `book` can be `flat`.

**Rationale:**
- Document type is semantic/descriptive (what *kind* of thing is this?)
- Organization is structural (how is it *arranged*?)
- A short book might be flat; a long article might have chapters
- Separating concerns allows flexibility without sacrificing clarity

### Why content is external (`contentRef`)

**Decision:** Sections reference content via path/URI rather than embedding it.

**Rationale:**
- Keeps metadata envelopes lightweight and cacheable
- Content can be in any format (Markdown, JSON, YAML, HTML, etc.)
- Enables lazy loading and partial document access
- Supports content reuse across documents
- `mediaType` hint allows consumers to handle content appropriately

### Why SemVer is strictly enforced

**Decision:** The `version` field uses a regex that validates full SemVer 2.0.0 compliance.

**Rationale:**
- Predictable version comparison across tooling
- Pre-release and build metadata supported for edge cases
- Industry standard; no ambiguity about version ordering
- Enables dependency version constraints (e.g., `^1.2.0`)

### Why namespace requires two segments

**Decision:** Pattern `^[a-zA-Z0-9]+(?:[.-][a-zA-Z0-9]+)+$` requires at least two segments.

**Rationale:**
- Prevents namespace squatting with single-word names
- Encourages reverse-DNS style ownership (`com.company.team`)
- Reduces collision risk in large organizations
- Still allows internal shorthand (`internal.hr`, `team.ml`)

### Why `integrity` uses hex digests

**Decision:** SHA-256/384/512 with hexadecimal encoding.

**Rationale:**
- SHA-2 family is widely supported and secure
- Hex encoding is human-readable and tool-friendly
- No base64 variants to normalize
- Digest length implicitly validates algorithm match

### Why both `changelog` and `revisionHistory` exist

**Decision:** Two separate audit mechanisms serve different audiences.

**Rationale:**
- `changelog`: User-facing release notes, one entry per version bump
- `revisionHistory`: Fine-grained audit trail for compliance, individual edits logged
- Different consumers (end users vs. auditors) need different granularity
- Separation prevents changelog bloat while maintaining audit capability

### Why `expirationAction` exists

**Decision:** `expiresAt` alone doesn't specify behavior; `expirationAction` makes intent explicit.

**Rationale:**
- "Expired" can mean many things: notify someone, auto-deprecate, archive, or delete
- Systems can implement the declared action consistently
- Prevents ambiguity in automated lifecycle management
- Default `notify` is safest — no data loss without explicit intent

---

## Validation Rules

### Schema-Enforced Rules

1. **Required fields:** `id`, `title`, `version`, `namespace`, `documentType`, `organization`, `sections` (min 1), `meta.createdAt`, `meta.updatedAt`

2. **Organization consistency:**
   - `flat` → `chapters` and `parts` must be absent
   - `chapters` → `chapters` required, `parts` must be absent
   - `parts` → `parts` required, `chapters` must be absent
   - `chapters-parts` → both `chapters` and `parts` required
   - `parts-chapters` → both `chapters` and `parts` required

3. **Version format:** Must match SemVer 2.0.0 pattern

4. **Namespace format:** Must have 2+ segments separated by `.` or `-`

5. **Timestamps:** Must be ISO 8601 date-time format

### Consumer-Enforced Rules

These cannot be validated by JSON Schema alone:

1. **ID uniqueness:** Section/chapter/part IDs must be unique within their arrays
2. **Reference integrity:** IDs in `chapters[].sections`, `parts[].sections`, etc. must exist in `sections[]`
3. **Hierarchy consistency:** In `chapters-parts`, chapters must reference parts (not sections directly)
4. **Digest validation:** `integrity.digest` length must match `integrity.algorithm` (64/96/128 hex chars)

---

## Extension Points

### Using `$dynamicAnchor`

The schema declares `"$dynamicAnchor": "metadata"` for composition-based extension:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/extended-metadata.json",
  "$ref": "https://vera.example.com/schemas/document-metadata-v1.1.json",
  "$defs": {
    "customMeta": {
      "$dynamicAnchor": "metadata",
      "allOf": [
        { "$ref": "https://vera.example.com/schemas/document-metadata-v1.1.json#metadata" },
        {
          "properties": {
            "meta": {
              "properties": {
                "customField": { "type": "string" }
              }
            }
          }
        }
      ]
    }
  }
}
```

### Adding Custom Section Properties

Extend section definitions for domain-specific needs:

```json
{
  "sections": [
    {
      "id": "api-users",
      "title": "Users API",
      "contentRef": "./api/users.yaml",
      "mediaType": "application/x-yaml",
      "x-api-version": "2024-01",
      "x-deprecation-date": "2025-06-01"
    }
  ]
}
```

Note: Custom properties require `"additionalProperties": true` or explicit extension of the section schema.

---

## Quick Reference

### Minimal Valid Document

```json
{
  "id": "example:readme:v1",
  "title": "Project README",
  "version": "1.0.0",
  "namespace": "com.example",
  "documentType": "article",
  "organization": "flat",
  "sections": [
    {
      "id": "blank",
      "title": "Blank...",
      "contentRef": "./README.md"
    }
  ],
  "meta": {
    "createdAt": "2025-01-15T00:00:00Z",
    "updatedAt": "2025-01-15T00:00:00Z"
  }
}
```

### Complete Example

```json
{
  "id": "vera:doc:user-guide:2025",
  "title": "Platform User Guide",
  "subtitle": "Complete reference for end users",
  "version": "2.1.0",
  "namespace": "com.vera.docs",
  "documentType": "book",
  "organization": "chapters",
  "description": "Comprehensive guide covering installation, configuration, and daily usage of the Vera platform.",
  "aliases": ["user-manual", "vera-guide"],
  "dependencies": [
    {
      "id": "vera:doc:api-reference:v2",
      "relationship": "references",
      "versionConstraint": "^2.0.0"
    }
  ],
  "sections": [
    { "id": "sec-intro", "title": "Welcome", "number": 1, "contentRef": "./ch1/welcome.md", "mediaType": "text/markdown" },
    { "id": "sec-install", "title": "Installation", "number": 2, "contentRef": "./ch1/installation.md", "mediaType": "text/markdown" },
    { "id": "sec-config", "title": "Configuration", "number": 3, "contentRef": "./ch2/config.md", "mediaType": "text/markdown" }
  ],
  "chapters": [
    { "id": "ch-1", "title": "Getting Started", "number": 1, "sections": ["sec-intro", "sec-install"] },
    { "id": "ch-2", "title": "Setup", "number": 2, "sections": ["sec-config"] }
  ],
  "meta": {
    "createdAt": "2024-03-01T09:00:00Z",
    "updatedAt": "2025-01-10T14:30:00Z",
    "lifecycle": "active",
    "authors": [
      { "name": "Jane Smith", "email": "jane@example.com", "organization": "Vera Inc." }
    ],
    "maintainers": ["docs-team@vera.example.com"],
    "keywords": ["user guide", "documentation", "platform"],
    "domains": ["documentation", "end-user"],
    "tags": ["public", "stable"],
    "license": "CC-BY-4.0",
    "source": "https://github.com/vera/docs",
    "integrity": {
      "algorithm": "sha256",
      "digest": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd"
    }
  }
}
```

---

## License

This schema specification is provided under [LICENSE]. See LICENSE.txt for complete terms.
