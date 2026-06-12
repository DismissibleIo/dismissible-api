# Getting Started Wizard

## Overview

A client-side interactive wizard that guides developers through configuring the Dismissible API. The wizard asks a series of questions based on the available configuration options and produces a ready-to-use `.env` file and an inline `docker run` command with all the correct settings. It runs entirely in the browser with no server communication, so it can be hosted at https://dismissible.io/ and also run locally.

## Stories

### 1. Walk through configuration step by step

```
As a developer
I want a guided wizard that asks me questions about my setup
So that I don't have to read through all the configuration docs to get started
```

### 2. Generate a .env file

```
As a developer
I want the wizard to produce a .env file with my chosen settings
So that I can drop it into my project and run the API immediately
```

### 3. Generate a docker run command

```
As a developer
I want the wizard to produce an inline docker run command with all the correct -e flags
So that I can copy-paste it and start the API without writing a .env file
```

### 4. Host the wizard online and run locally

```
As a developer
I want to use the wizard at dismissible.io or run it locally
So that I can configure the API wherever is most convenient
```

## Acceptance criteria

### Wizard flow

- [ ] Wizard runs entirely client-side (no server calls, no analytics, no telemetry).
- [ ] Wizard is a single-page app that can be deployed as static assets to https://dismissible.io/ and also run locally (e.g. `npx`, opening an HTML file, or a simple local dev server).
- [ ] Each configuration section is presented as a step/screen. Sections and the questions within them should follow the order and grouping in `docs/CONFIGURATION.md`:
  1. **Core** – port, storage type, run setup.
  2. **Storage** – conditional on storage type selection (PostgreSQL, DynamoDB, or In-Memory), only show the relevant fields.
  3. **Cache** – whether to enable caching, and conditional on cache type (Redis, Memory), only show the relevant fields.
  4. **Swagger** – enable/disable and path.
  5. **JWT Authentication** – enable/disable, and if enabled show OIDC/JWT fields. Conditional fields for user ID match type (exact, substring, regex).
  6. **CORS** – enable/disable and related fields.
  7. **Security Headers (Helmet)** – enable/disable and sub-options.
  8. **Validation** – toggle individual validation settings.
  9. **Rate Limiter** – enable/disable and related fields. Conditional fields for key type, key mode, ignored keys.
- [ ] Steps with conditional fields only show the relevant inputs (e.g. selecting `postgres` storage hides DynamoDB and Memory fields).
- [ ] Sensible defaults are pre-filled matching the defaults in `docs/CONFIGURATION.md`.
- [ ] User can navigate forward and backward between steps without losing answers.
- [ ] A summary/review step is shown before generating output, listing all chosen values.

### Output generation

- [ ] **`.env` file**: Generated as a downloadable file (or copyable text block) containing `KEY=value` pairs for every configured variable. Variables left at their default should still be included (commented out or clearly marked) so the user can see what's available.
- [ ] **`docker run` command**: Generated as a copyable text block with the Docker image (`dismissibleio/dismissible-api`), port mapping, and `-e KEY=value` flags for every configured variable. Default values can be omitted for brevity, with a toggle or note to show/hide defaults.
- [ ] Sensitive values (connection strings, secrets, access keys) should be masked or redacted by default with a toggle to reveal them.

### UX

- [ ] Responsive design that works on desktop and mobile.
- [ ] Clear progress indicator showing current step and total steps.
- [ ] Inline help text / tooltips sourced from the descriptions in `docs/CONFIGURATION.md`.
- [ ] Copy-to-clipboard buttons for both the `.env` output and the `docker run` command.
- [ ] Download button for the `.env` file.

## Technical notes

- All configuration options and their defaults are documented in `docs/CONFIGURATION.md`. The wizard should be kept in sync with that file.
- The Docker image is `dismissibleio/dismissible-api` on Docker Hub.
- No backend or build step should be required to run the wizard locally — a single HTML file or a lightweight static site (e.g. Vite/React, plain HTML+JS) is preferred.

## Open questions

- Technology choice for the wizard UI (plain HTML+JS, React, Vue, Svelte, etc.).
- Where in the repo should the wizard source live (e.g. `wizard/`, `tools/wizard/`)?
- Should the wizard also generate a `docker-compose.yml` or `.env.yaml` in addition to `.env` and `docker run`?
- Hosting strategy for https://dismissible.io/ (GitHub Pages, Cloudflare Pages, Vercel, etc.).
