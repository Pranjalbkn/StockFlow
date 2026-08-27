<div align="center">

# StockFlow

### Voice-enabled inventory management for modern businesses

Record sales and purchases naturally, manage stock with confidence, and turn everyday inventory activity into clear business insight.

[![React](https://img.shields.io/badge/React-TypeScript-149ECA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-Node.js-111827?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Gemini](https://img.shields.io/badge/Gemini-Voice_AI-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## Why StockFlow?

Most student inventory projects stop at forms and CRUD operations. StockFlow goes further by combining real inventory workflows with safe, AI-assisted voice entry.

An employee can say:

> “Sold three notebooks to Rahul for 80 rupees each.”

StockFlow interprets the command, matches it against the business's real product catalog, shows an editable preview, and updates inventory only after the user confirms it.

The AI interprets language—but authorization, validation, stock checks, and database updates always remain controlled by the application.

## Highlights

- **Voice-powered stock entry** for multi-product sales and purchases
- **English and Hinglish commands** interpreted through the Gemini API
- **Human confirmation layer** before any AI-assisted action changes stock
- **Multi-item invoices** with automatic totals and transactional stock deduction
- **PDF invoice generation** and WhatsApp-friendly customer sharing
- **Role-based workspaces** for owners, managers, and salespeople
- **Complete stock movement history** across purchases, sales, and adjustments
- **Responsive, phone-first interface** with mobile cards and floating voice access
- **Secure authentication** using JWTs stored in HTTP-only cookies
- **Direct PostgreSQL integration** with `pg`—no ORM or hidden database logic

## Voice command workflow

```mermaid
flowchart LR
    A[Employee speaks] --> B[Browser records audio]
    B --> C[Express API]
    C --> D[Gemini interprets command]
    D --> E[Catalog matching]
    E --> F[Editable confirmation]
    F -->|Confirm| G[Server validation]
    F -->|Discard| H[Temporary entry removed]
    G --> I[PostgreSQL transaction]
    I --> J[Invoice + stock movement]
```

### Safety by design

Gemini never writes to the database directly. The backend independently verifies:

- The authenticated user's brand and role
- Product and supplier ownership
- Product IDs returned by the model
- Positive quantities and valid prices
- Available stock before a sale
- Permission to record a purchase
- Complete transaction validity before commit

If one item fails, PostgreSQL rolls back the entire transaction—preventing partial invoices and inconsistent stock.

## Feature tour

| Area | Capabilities |
| --- | --- |
| Dashboard | Monthly sales, inventory value, low-stock overview, quick actions |
| Products | Products, SKUs, categories, pricing, stock thresholds, archiving |
| Purchases | Supplier management, purchase records, automatic stock increase |
| Sales | Multi-product invoices, customer details, automatic stock deduction |
| Voice Entry | Audio commands, Gemini interpretation, catalog matching, confirmation |
| Invoices | Downloadable PDF invoices and WhatsApp sharing workflow |
| Stock History | Auditable record of every inventory movement |
| Reports | Daily sales, purchases, units sold, low stock, and top products |
| Team | Brand identity, employee accounts, roles, and account status |

## Roles and permissions

| Capability | Owner | Manager | Salesperson |
| --- | :---: | :---: | :---: |
| View inventory and reports | ✅ | ✅ | ✅ |
| Record sales | ✅ | ✅ | ✅ |
| Use voice sales | ✅ | ✅ | ✅ |
| Record purchases | ✅ | ✅ | — |
| Manage products and suppliers | ✅ | ✅ | — |
| Manage employees and brand | ✅ | — | — |

## Architecture

```mermaid
flowchart TB
    subgraph Client[React Client]
        UI[Responsive Tailwind UI]
        PDF[PDF Invoice Generator]
        Voice[Audio Recorder]
    end

    subgraph Server[Express API]
        Auth[JWT Authentication]
        RBAC[Role Authorization]
        Validation[Zod Validation]
        Business[Inventory Transactions]
        Gemini[Gemini Integration]
    end

    subgraph Data[Data Layer]
        PG[(PostgreSQL / Neon)]
    end

    UI --> Server
    Voice --> Gemini
    Auth --> RBAC
    RBAC --> Validation
    Validation --> Business
    Business --> PG
    UI --> PDF
```

## Technology stack

### Frontend

- React and TypeScript
- Vite and Tailwind CSS
- React Router and Lucide icons
- jsPDF and jsPDF-AutoTable
- MediaRecorder API

### Backend

- Node.js, Express, and TypeScript
- PostgreSQL through `pg`
- Zod request and AI-output validation
- JWT authentication and bcrypt password hashing
- Helmet, CORS, cookie-parser, and rate limiting
- Gemini multimodal API and Vitest

### Database

- PostgreSQL hosted locally or on Neon
- Versioned SQL migrations
- Transactional sales and purchases
- Relational products, categories, suppliers, invoices, employees, and movements

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm
- A PostgreSQL database or Neon project
- A Gemini API key for voice entry

### 1. Clone the repository

```bash
git clone https://github.com/Pranjalbkn/StockFlow.git
cd StockFlow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the server

Copy `server/.env.example` to `server/.env` and replace the placeholders:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
GEMINI_API_KEY=your-google-ai-studio-key
GEMINI_MODEL=gemini-3.6-flash
```

Never commit `server/.env`. API keys and database credentials must remain on the server.

### 4. Run database migrations

```bash
npm run db:migrate --workspace server
```

### 5. Start StockFlow

Open two terminals:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

Then visit [http://localhost:5173](http://localhost:5173).

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev:client` | Start the React development server |
| `npm run dev:server` | Start the Express API in watch mode |
| `npm run build` | Build the frontend and backend |
| `npm test --workspace server` | Run backend tests |
| `npm run db:migrate --workspace server` | Apply pending SQL migrations |

## Environment and security

- Secrets are stored only in `server/.env`
- The Gemini key is never sent to the browser
- Passwords are hashed with bcrypt
- Authentication tokens use HTTP-only cookies
- Production cookies use secure settings
- CORS restricts allowed frontend origins
- AI endpoints use request rate limiting and audio-size limits
- All database queries are parameterized
- User and brand ownership is checked server-side

## Project structure

```text
StockFlow/
├── client/
│   └── src/
│       ├── components/       Shared application UI
│       ├── pages/            Dashboard and workflow pages
│       ├── services/         Backend API clients and PDF generation
│       └── types/            TypeScript data models
├── server/
│   ├── database/migrations/  Versioned PostgreSQL schema
│   └── src/
│       ├── auth/             JWT utilities
│       ├── middleware/       Authentication and role checks
│       ├── routes/           REST API endpoints
│       ├── services/         Gemini command interpretation
│       └── utils/            Totals and product-name matching
├── package.json              Workspace commands
└── README.md
```

## What makes this project different?

StockFlow treats AI as an assistant—not as an authority. Natural language improves speed, while deterministic backend rules preserve correctness.

1. Gemini understands what the employee said.
2. StockFlow maps the response to real business data.
3. The employee reviews and confirms the interpretation.
4. Express validates permission and inventory rules.
5. PostgreSQL commits the complete operation atomically.

## Roadmap

- Explainable demand forecasting and reorder suggestions
- Dead-stock detection and blocked-capital reporting
- Product bundles and component-level stock deduction
- Batch, expiry, and FEFO inventory management
- Expanded API and transaction test coverage
- Production deployment and demo workspace

---

<div align="center">

Built by [Pranjal Gupta](https://github.com/Pranjalbkn)

**If StockFlow interests you, consider giving the repository a star.**

</div>
