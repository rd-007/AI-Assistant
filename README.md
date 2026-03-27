# RD's Assistant

A React + Vite AI assistant UI backed by NVIDIA APIs through a local Node proxy.

This project supports:

- Multi-thread chat history with local persistence
- Standard chat completions
- Vision requests with image input
- Document parsing flow for supported file types
- A local proxy server to avoid browser-side CORS issues and keep the API key off the frontend

## Tech Stack

- React 19
- Vite 7
- Tailwind CSS 4
- Node.js HTTP server for API proxying
- NVIDIA hosted model endpoints

## Features

### Chat Threads

- Create, switch, and delete conversation threads
- Thread data is stored in `localStorage`
- Each thread keeps its own message history

### NVIDIA-Powered Workflows

- Text chat requests are proxied to NVIDIA chat completions
- Image requests are routed through a vision-capable model
- Document uploads are routed through a document parsing endpoint before summarization

### Safer API Architecture

- The frontend calls local `/api/*` routes
- The Node server forwards requests to NVIDIA
- API keys stay on the server side instead of being exposed in the browser

## Project Structure

```text
.
├── src/
│   ├── components/
│   ├── constants/
│   └── App.jsx
├── scripts/
│   └── dev.mjs
├── server.mjs
├── vite.config.js
└── package.json
```

## Environment Variables

Create a `.env` file in the project root.

```env
NVIDIA_API_KEY=your_nvidia_api_key_here
PORT=8787
```

Notes:

- `NVIDIA_API_KEY` is the preferred variable name.
- The server also accepts `VITE_NVIDIA_API_KEY` for backward compatibility, but it is better not to expose provider keys through Vite-prefixed vars.
- `PORT` is optional. The default is `8787`.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Add your environment variables

Create `.env` and add your NVIDIA API key.

### 3. Run the app in development

```bash
npm run dev
```

This starts:

- the Vite frontend
- the local Node proxy server

By default, open:

- frontend: `http://localhost:5173`
- proxy health check: `http://localhost:8787/health`

## Available Scripts

### `npm run dev`

Starts both the frontend and the local API proxy for development.

### `npm run dev:web`

Starts only the Vite frontend.

### `npm run dev:api`

Starts only the local Node proxy server.

### `npm run build`

Builds the frontend for production.

### `npm start`

Starts the Node server and serves the built frontend from `dist/`.

### `npm run lint`

Runs ESLint.

## How Requests Flow

### Chat

1. The frontend sends a request to `/api/chat`
2. The local server forwards it to NVIDIA chat completions
3. The response is returned to the active thread

### Vision

1. The user selects an image
2. The frontend sends the prompt and image payload to `/api/chat`
3. The server forwards the request to the NVIDIA vision-capable model

### Documents

1. The user uploads a supported document
2. The frontend sends it to `/api/document-parse`
3. The server forwards the request to the NVIDIA parse endpoint
4. Extracted text is summarized through the chat model

## Current Models

The app is currently configured to use these model IDs:

- `meta/llama-3.1-8b-instruct`
- `nvidia/llama-3.1-nemotron-nano-8b-v1`
- `nvidia/nemotron-nano-12b-v2-vl`
- `nvidia/nemotron-parse`

Model access depends on your NVIDIA account and API permissions.

## Production Notes

- Build the frontend with `npm run build`
- Start the server with `npm start`
- The Node server serves static files from `dist/`
- The proxy server is required because direct browser calls to NVIDIA endpoints are blocked by CORS

## Limitations

- Thread storage is local to the browser and not synced across devices
- Document parsing depends on NVIDIA endpoint compatibility and file support
- Large or complex documents may require a more robust backend upload pipeline
- There is no authentication or user account system in this project

## Future Improvements

- Thread rename and search
- Streaming responses
- Persistent backend storage for threads
- Authentication
- Better document upload handling for large files
- Per-thread model preferences

## License

MIT License

