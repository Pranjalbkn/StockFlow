# StockFlow

StockFlow is a full-stack inventory and sales management application built with
React, Tailwind CSS, Express, TypeScript, and PostgreSQL.

## Local applications

- React client: `http://localhost:5173`
- Express API: `http://localhost:5000`
- Health route: `http://localhost:5000/api/health`

## Commands

Install dependencies:

```bash
npm install
```

Start the frontend and backend in separate terminals:

```bash
npm run dev:client
npm run dev:server
```

Build both applications:

```bash
npm run build
```

## Environment setup

Copy `server/.env.example` to `server/.env` and replace its placeholder values.
Never commit the `.env` file.

For AI-assisted voice entry, create a Gemini API key in Google AI Studio and add
these values to `server/.env`:

```env
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-3.6-flash
```

The key belongs only in the server environment. Do not prefix it with `VITE_` or
place it in the client folder.
