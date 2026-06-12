# Webhook feature

## Overview

A configurable webhook that can be called when a dismissible item is created, retrieved, dismissed, or restored.

## Stories

### 1. Configure webhook endpoint

```
As a developer
I want to be able to configure the webhook endpoint
So that I can receive updates when dismissible items are changed
```

### 2. Configure which events trigger the webhook

```
As a developer
I want to choose which events trigger the webhook (create, retrieved, dismiss, restore)
So that I only receive the events I care about
```

## Acceptance criteria

### Webhook endpoint

- [ ] Webhook URL is configurable (e.g. via env or app config, consistent with existing `DISMISSIBLE_*` style).
- [ ] Webhook is invoked with a well-defined payload (e.g. event type, item id, user id, item state, and optionally `previousItem` for dismiss/restore).
- [ ] Webhook calls are non-blocking (e.g. fire-and-forget or background job) so API latency is not tied to the external endpoint.
- [ ] Failed webhook calls are handled (e.g. retries, logging, and optionally dead-letter or alerting).

### Event subscription

- [ ] Configuration allows selecting which events trigger the webhook. Supported events:
  - **create** – new item created (`dismissible.item.created`).
  - **retrieved** – existing item returned from get/getOrCreate (`dismissible.item.retrieved`).
  - **dismiss** – item dismissed (`dismissible.item.dismissed`).
  - **restore** – dismissed item restored (`dismissible.item.restored`).
- [ ] Default behaviour is defined (e.g. “all events” or “create, dismiss, restore” only).
- [ ] If no events are selected, the webhook is not called (or config is invalid).

### Auth

- [ ] Webhook requests MUST be authenticated using **HMAC** (e.g. HMAC-SHA256 of the request body, sent in a header such as `X-Webhook-Signature` or `X-Dismissible-Signature`). Config must include a **webhook secret** used for signing.

## Webhook adapter pattern

Follow the same adapter pattern as **cache** and **storage**:

1. **Interface / core webhook lib** (e.g. `@dismissible/nestjs-webhook` or under `libs/core`):
   - Define injection token: `DISMISSIBLE_WEBHOOK_ADAPTER` (Symbol).
   - Define interface: `IDismissibleWebhook` with a single method, e.g. `emit(event: DismissibleEventType, payload: WebhookPayload): Promise<void>` (or one method per event, depending on preferred design).
   - Provide a **default no-op adapter** (like `NullCacheAdapter`) that implements the interface and does nothing, so the feature is optional when no webhook is configured.

2. **Concrete adapter lib** (e.g. `libs/http-webhook` or `libs/webhook-http`):
   - Implement `IDismissibleWebhook`.
   - Accept config: **URL**, **secret** (for HMAC), and **events** (subset of `create` | `retrieved` | `dismiss` | `restore`).
   - On `emit`: build payload, sign body with HMAC-SHA256 using the secret, POST to the configured URL with signature header (e.g. `X-Webhook-Signature` or `X-Dismissible-Signature`).
   - Expose a Nest dynamic module with `forRoot(options)` and optionally `forRootAsync(options)` that:
     - Provides the adapter and its config.
     - Registers the adapter under `DISMISSIBLE_WEBHOOK_ADAPTER` (e.g. `useExisting: HttpWebhookAdapter`).

3. **Core / app wiring**:
   - `DismissibleModule` (or equivalent) accepts an optional `webhook` option in its config (same style as `storage` and `cache`).
   - When present, the module imports the provided webhook module; otherwise it uses the default module that registers the no-op adapter.
   - Event handlers (for `dismissible.item.created`, etc.) inject `DISMISSIBLE_WEBHOOK_ADAPTER` and call `emit` only for events that are enabled in the adapter’s config. No need to support multiple webhook URLs in the first version; a single adapter instance is enough.

4. **Consistency with cache/storage**:
   - Same patterns: injection token + interface in a shared lib, default no-op implementation, concrete adapters in separate libs with `forRoot`/`forRootAsync`, and core choosing which module to import based on config.

## Technical notes

- Events are already emitted from `DismissibleService` in `libs/core`:
  - `DismissibleEvents.ITEM_CREATED`, `ITEM_RETRIEVED`, `ITEM_DISMISSED`, `ITEM_RESTORED` (see `libs/core/src/events/events.constants.ts`).
- Event payloads can align with existing event classes in `libs/core/src/events/dismissible.events.ts` (e.g. `ItemCreatedEvent`, `ItemRetrievedEvent`, `ItemDismissedEvent`, `ItemRestoredEvent`), so the webhook body can mirror those structures.
- Webhook config could live alongside existing options in `docs/CONFIGURATION.md` (e.g. `DISMISSIBLE_WEBHOOK_URL`, `DISMISSIBLE_WEBHOOK_EVENTS`).

## Open questions

- Retry policy (count, backoff, max age).
- Whether to support multiple webhook URLs in a future iteration.
