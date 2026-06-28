# AMOS Browser Worker v1

Browser Worker is a universal execution layer for AMOS agents.

It is not a VK connector, Telegram connector, YouTube connector, CRM connector, or publisher.
It does not contain business logic and does not know why an action is being performed.

Its only responsibility is to execute browser actions in a controlled Playwright session.

## Purpose

AMOS agents should be able to use one shared browser worker for any website:

- VK
- Telegram Web
- YouTube Studio
- MAX
- RuTube
- CRM
- Alibaba
- Korex
- any other web interface

Agents decide what to do.
Browser Worker only performs the browser steps.

## Supported Operations

The worker supports these universal operations:

- `launch`
- `openUrl`
- `wait`
- `click`
- `type`
- `uploadFile`
- `downloadFile`
- `readText`
- `takeScreenshot`
- `scroll`
- `close`

## Scenario Format

Agents can call the worker with a JSON scenario:

```json
{
  "browser": {
    "headless": false,
    "slowMo": 100
  },
  "steps": [
    {
      "action": "launch"
    },
    {
      "action": "openUrl",
      "url": "https://example.com"
    },
    {
      "action": "wait",
      "ms": 1000
    },
    {
      "action": "readText",
      "selector": "body",
      "saveAs": "pageText"
    },
    {
      "action": "takeScreenshot",
      "path": "AMOS/public/screenshots/example.png",
      "fullPage": true
    },
    {
      "action": "close"
    }
  ]
}
```

Run example:

```bash
node scripts/workers/browser-worker.js AMOS/workflows/browser-example.json
```

## Operation Contract

### launch

Starts a Playwright Chromium browser.

```json
{
  "action": "launch",
  "headless": false
}
```

### openUrl

Opens a URL in the current page.

```json
{
  "action": "openUrl",
  "url": "https://example.com",
  "waitUntil": "domcontentloaded"
}
```

### wait

Waits for a fixed time or a selector.

```json
{
  "action": "wait",
  "ms": 1000
}
```

```json
{
  "action": "wait",
  "selector": "#app"
}
```

### click

Clicks an element.

```json
{
  "action": "click",
  "selector": "button[type='submit']"
}
```

### type

Types text into an input or textarea.

```json
{
  "action": "type",
  "selector": "textarea",
  "text": "Post text"
}
```

### uploadFile

Uploads a local file into a file input.

```json
{
  "action": "uploadFile",
  "selector": "input[type='file']",
  "path": "public/uploads/example.webp"
}
```

### downloadFile

Waits for a download triggered by a click and saves it locally.

```json
{
  "action": "downloadFile",
  "selector": "a.download",
  "path": "AMOS/public/downloads/file.csv"
}
```

### readText

Reads text from the page and stores it in worker results.

```json
{
  "action": "readText",
  "selector": "body",
  "saveAs": "bodyText"
}
```

### takeScreenshot

Takes a screenshot.

```json
{
  "action": "takeScreenshot",
  "path": "AMOS/public/screenshots/page.png",
  "fullPage": true
}
```

### scroll

Scrolls the page.

```json
{
  "action": "scroll",
  "x": 0,
  "y": 1200
}
```

### close

Closes browser resources.

```json
{
  "action": "close"
}
```

## Design Rules

- No platform-specific publishing logic.
- No VK API.
- No Telegram API.
- No YouTube Studio assumptions.
- No hardcoded project workflows.
- No credentials stored in the worker.
- Agents pass scenarios; Browser Worker executes them.

## Future AMOS Integration

Possible future call chain:

```text
Content Agent
-> Publisher Agent
-> platform-specific scenario builder
-> Browser Worker
-> browser actions
-> execution report
```

The scenario builder may be VK-specific or YouTube-specific later.
Browser Worker must remain universal.
