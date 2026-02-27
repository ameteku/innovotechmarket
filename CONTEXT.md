# InnovoTech Market — Project Context

## Overview

A React/Vite web app (marketplace) with a Vercel serverless API that generates AI music via ElevenLabs and sends it to a WhatsApp group via Green API.

---

## Architecture

```
Frontend (React + Vite + Shadcn UI)
    │
    └── Deployed to Vercel (static site)

Backend (Vercel Serverless Functions)
    └── api/generate-and-send.js
            │
            ├── 1. Verifies API key via Unkey
            ├── 2. Generates music via ElevenLabs SDK
            ├── 3. Uploads audio to Vercel Blob (temp public URL)
            ├── 4. Sends to WhatsApp group via Green API sendFileByUrl
            └── 5. Deletes blob after 60s (Green API fetches async)
```

---

## API: `POST /api/generate-and-send`

### Auth
```
Authorization: Bearer <unkey-api-key>
```
Keys are managed in [Unkey](https://app.unkey.com) — create keys under the configured API and share them with clients.

### Request Body (JSON, all fields optional)
```json
{
  "prompt": "Upbeat electronic music with synth, bass, and drums",
  "music_length_ms": 30000,
  "lyrics": "Line 1\nLine 2\nLine 3"
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `prompt` | string | `"Upbeat electronic music..."` | Style description |
| `music_length_ms` | number | `30000` | Duration in ms (30s default) |
| `lyrics` | string | `null` | Newline-separated lyrics. Triggers vocal mode. |

### Response
```json
{
  "success": true,
  "message": "Song generated and sent to WhatsApp group",
  "messageId": "BAE5...",
  "fileUrl": "...",
  "fileName": "song_1234567890.mp3"
}
```

### Health Check
```
GET /api/generate-and-send
```

---

## Lyrics Mode vs Instrumental Mode

- **No `lyrics` param** → `{ prompt, musicLengthMs }` → ElevenLabs generates instrumental
- **With `lyrics` param** → `compositionPlan` with:
  - `positiveGlobalStyles: [prompt, 'vocals', 'singing', 'male vocalist']`
  - `negativeGlobalStyles: ['instrumental']`
  - `sections[].lines` = split lyrics array

**Tips for reliable lyrics:**
- Keep each line under ~100 characters
- Use `\n` to separate lines in the JSON body

---

## Environment Variables

Set in Vercel Project Settings → Environment Variables (or `.env.local` for local dev).

| Variable | Where to get it |
|----------|----------------|
| `ELEVENLABS_API_KEY` | [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys) |
| `GREEN_API_INSTANCE_ID` | [console.green-api.com](https://console.green-api.com) → Instance ID |
| `GREEN_API_TOKEN` | Green API console → apiTokenInstance |
| `GROUP_CHAT_ID` | Green API console → Chats → copy group chatId (e.g. `120363XXXXXXXXXX@g.us`) |
| `UNKEY_API_ID` | [app.unkey.com](https://app.unkey.com) → APIs → your API → copy `apiId` |
| `UNKEY_ROOT_KEY` | Unkey → Settings → Root Keys → create with `verify_key` permission |
| `BLOB_READ_WRITE_TOKEN` | Auto-set by Vercel when you link a Blob store (`vercel blob store add`) |

> **Note:** All env vars are `.trim()`ed in code to handle trailing newlines from CLI input.

---

## Deployment

### Project
- **Platform:** Vercel
- **Vercel Org:** `quikghanas-projects`
- **Project name:** `innovotechmarket`
- **Region:** `fra1` (Frankfurt — closest to Green API servers)
- **Max function duration:** 300s (music generation can take 60-90s)

### Deploy command
```bash
vercel --prod
```

### First-time setup
```bash
# Link to existing project
vercel link
# → Select: quikghanas-projects / innovotechmarket

# Add env vars
echo "your_value" | vercel env add ELEVENLABS_API_KEY production
echo "your_value" | vercel env add GREEN_API_INSTANCE_ID production
echo "your_value" | vercel env add GREEN_API_TOKEN production
echo "your_value" | vercel env add GROUP_CHAT_ID production
echo "your_value" | vercel env add UNKEY_API_ID production
echo "your_value" | vercel env add UNKEY_ROOT_KEY production

# Create and link Vercel Blob store
vercel blob store add
# BLOB_READ_WRITE_TOKEN is automatically added to project env vars

# Deploy
vercel --prod
```

---

## External Services

### ElevenLabs
- SDK: `@elevenlabs/elevenlabs-js` (NOT the `elevenlabs` package — that one has no `music` property)
- API used: `elevenlabs.music.compose()`
- Credits are consumed per generation

### Green API (WhatsApp)
- Used: `sendFileByUrl` endpoint (on the regular API server `https://XXXX.api.greenapi.com`)
- **NOT** `sendFileByUpload` — Vercel's server IPs are blocked by Green API's media server
- The instance must be authorized (phone linked) in the Green API console
- Green API downloads the file asynchronously after returning `messageId` — blob must remain live for ~60s

### Unkey
- API key management and verification
- Server-side: uses `rootKey` to verify client keys
- Create client keys in Unkey dashboard under the configured API
- v2 SDK usage: `new Unkey({ rootKey }).keys.verifyKey({ key, apiId })`

### Vercel Blob
- Temporary file hosting to bridge ElevenLabs audio → Green API
- Files are deleted 60 seconds after Green API acknowledges receipt

---

## Key Technical Decisions & Gotchas

1. **Use `@elevenlabs/elevenlabs-js` not `elevenlabs`** — the `elevenlabs` v1.x package has no `music` property
2. **`sendFileByUrl` not `sendFileByUpload`** — Vercel IPs are blocked by Green API's media upload server
3. **60s blob cleanup delay** — Green API returns `messageId` immediately but fetches the file async; deleting too early causes missing media
4. **`.trim()` all env vars** — `echo "value" | vercel env add` adds trailing newlines
5. **Unkey v2 requires `rootKey`** — unlike v1, server-side key verification needs a root key, not just the API ID
6. **`maxDuration: 300` required** — default 10s Vercel timeout is too short for music generation

---

## Local Development

```bash
npm install
npm run dev          # Frontend on http://localhost:5173
vercel dev           # Full stack with API on http://localhost:3000
```

For local API testing, set env vars in `.env.local` (copy from `.env.example`).

---

## Testing the API

```bash
curl -X POST https://innovotechmarket.vercel.app/api/generate-and-send \
  -H "Authorization: Bearer <your-unkey-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Afrobeats with guitar and percussion",
    "music_length_ms": 30000
  }'

# With lyrics:
curl -X POST https://innovotechmarket.vercel.app/api/generate-and-send \
  -H "Authorization: Bearer <your-unkey-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Afrobeats with guitar",
    "lyrics": "We rise up together\nBuilding something new\nInnovotech market\nChanging the world for you"
  }'
```
