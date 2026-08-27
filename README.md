# QuantFlow 📈⚡

### Real-Time Financial Market Analytics Terminal & Quantitative Paper Trading Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 📌 Project Overview

**QuantFlow** is a high-performance, full-stack financial market terminal and paper trading ecosystem engineered for active traders, quantitative researchers, and financial analysts.

Built with an ultra-responsive dark-mode UI inspired by institutional Bloomberg and TradingView terminals, QuantFlow delivers **sub-millisecond state synchronization**, **multi-asset market data streaming** (Equities, Forex, Crypto, Futures, and Commodities), **computational technical indicators**, **dynamic stock screeners**, and an **ACID-compliant virtual paper trading engine with $100,000 in simulated capital**.

---

## 🚀 Key Modules & Capabilities

### 1. 📊 Institutional Interactive Charting
- **Lightweight Charts Engine**: Hardware-accelerated candlestick rendering with volume histograms.
- **Multi-Timeframe Analysis**: Instant switching between `1m`, `5m`, `15m`, `30m`, `1H`, `4H`, `1D`, `1W`, `1M`, `1Y`, and `MAX`.
- **Live Bid/Ask Ticks**: Real-time crosshair price tracking, high/low badges, and OHLC data feeds.

### 2. 📐 Quantitative Technical Indicators Engine
- **Moving Averages**: Simple Moving Average (**SMA 20, 50, 200**) & Exponential Moving Average (**EMA 12, 26**).
- **Momentum & Volatility**: Relative Strength Index (**RSI 14**), Moving Average Convergence Divergence (**MACD**), **Bollinger Bands** ($\pm 2\sigma$), **VWAP** (Volume-Weighted Average Price), and Average True Range (**ATR 14**).
- **Extensible Architecture**: Modular mathematical calculation services for plug-and-play indicator creation.

### 3. ⚡ High-Throughput Real-Time Streaming Pipeline
- **WebSocket Gateway (`/ws`)**: Bi-directional tick distribution with targeted client subscriptions (`SUBSCRIBE` / `UNSUBSCRIBE`).
- **Redis Pub/Sub Layer**: Decoupled market ingestion pipeline broadcasting thousands of ticks/sec across worker nodes.
- **Market Status Normalizer**: Real-time connection monitoring with explicit status indicators (**LIVE**, **DELAYED**, **MARKET CLOSED**, **DISCONNECTED**).

### 4. 🌍 Multi-Asset Global Market Coverage
- **Equities**: Global exchanges including **NASDAQ**, **NYSE**, **NSE** (National Stock Exchange of India), **BSE**, **LSE**, **DAX**, **Nikkei 225**, and **HKEX**.
- **Crypto Assets**: Live feeds for BTC, ETH, SOL, XRP, BNB, and ADA with market depth.
- **Forex Currency Pairs**: EUR/USD, GBP/USD, USD/JPY, USD/INR, AUD/USD, USD/CAD.
- **Futures & Commodities**: Gold, Silver, Crude Oil, Natural Gas, S&P 500 E-mini, and NASDAQ 100 Futures.

### 5. 🔍 Multi-Factor Stock Screener
- Filter global equities by **Valuation Multiples** (P/E, Forward P/E, PEG), **Market Capitalization**, **Dividend Yield**, **Sector/Industry**, and **52-Week High/Low Distance**.
- Instant full-text fuzzy search across thousands of ticker symbols and company names.

### 6. 💼 ACID-Compliant Paper Trading Engine
- **$100,000 Virtual Balance**: Risk-free portfolio simulation for strategy testing.
- **Order Types**: Instant **MARKET** orders and condition-based target **LIMIT** orders (`BUY_LIMIT`, `SELL_LIMIT`).
- **Atomic Transactions**: Strict balance checks, position validation, and atomic executions wrapped in Prisma `$transaction` blocks.
- **Mark-to-Market Portfolio**: Dynamic real-time calculation of unrealized and realized P/L, total equity, cash allocations, and transaction history.

### 7. 🔔 Watchlists & Smart Price Alerts
- **Custom Watchlists**: Create, reorder, and stream real-time price changes across personalized asset baskets.
- **Price Alerts Engine**: Set boundary alerts (`ABOVE`, `BELOW`) that track active price movements and log trigger events.

### 8. 📰 Market Intelligence, Calendars & Community Hub
- **Financial News Stream**: Real-time breaking headlines with sentiment classification (**Bullish**, **Bearish**, **Neutral**).
- **Economic & IPO Calendars**: Track macroeconomic indicators, central bank rate decisions, and upcoming IPO listings.
- **Social Trading Hub**: Share trade setups, publish chart annotations, and engage in strategy discussions with fellow traders.

### 9. 🔐 Enterprise Authentication & Security
- **Dual Authentication**: Native email/password authentication (with bcrypt hashing) and **Google Identity Services (GIS) OAuth 2.0**.
- **Secure JWT Session Management**: Signed tokens for REST API verification and WebSocket handshake authentication.
- **Account Safeguards**: Automatic brute-force protection, input validation via Zod schemas, and isolated credentials.

---

## 🔄 Complete User & Data Workflows

### 📈 Trader / Analyst Lifecycle

```mermaid
flowchart LR
    A[Sign In / Google OAuth] --> B[Browse Markets & Global Screener]
    B --> C[Select Asset & Open Terminal]
    C --> D[Multi-Timeframe Candlestick & Indicators]
    D --> E[Configure Price Trigger Alert]
    E --> F[Execute Virtual Paper Order Market/Limit]
    F --> G[Real-Time Mark-to-Market P/L Tracking]
    G --> H[Publish Trade Idea to Community Hub]
```

1. **Authentication**: Sign in via Google OAuth 2.0 or one-click demo access with an instant **$100,000** virtual balance.
2. **Discovery**: Filter equities via the Multi-Factor Screener or search symbols across global exchanges.
3. **Deep Analysis**: Analyze real-time price action with multi-timeframe charts and dynamic indicators (RSI, MACD, Bollinger Bands).
4. **Alerts**: Set smart price boundary notifications.
5. **Execution**: Place virtual market or limit orders with automated position sizing and balance checks.
6. **Portfolio Tracking**: Monitor live unrealized P/L, cash balance, and asset breakdown as market ticks arrive.
7. **Social Sharing**: Share trade ideas, technical setups, and chart snapshots with the trading community.

---

### ⚡ Real-Time Data Pipeline Architecture

```mermaid
flowchart TD
    subgraph Data_Sources["Data Ingestion Sources"]
        A1[Finnhub REST/WS]
        A2[Upstox NSE API]
        A3[Binance Crypto Stream]
        A4[Stochastic GBM Market Simulator]
    end

    subgraph Backend_Core["QuantFlow Core Ingestion (Node.js/Express)"]
        B1[MarketDataProvider Router]
        B2[MarketDataNormalizer & Symbol Resolver]
        B3[Indicator Calculation Engine]
    end

    subgraph State_Bus["Cache & Messaging Layer"]
        C1[(Redis State Cache)]
        C2[Redis Pub/Sub Event Bus]
    end

    subgraph Gateway["Real-Time Gateway"]
        D1[Express WebSocket Gateway /ws]
        D2[Prisma ORM & PostgreSQL]
    end

    subgraph Client["React Client (Vite + TypeScript)"]
        E1[TradingView Lightweight Charts]
        E2[Zustand Stores & React Query]
        E3[Terminal UI / Watchlists / Orders]
    end

    Data_Sources --> B1
    B1 --> B2
    B2 --> B3
    B2 --> C1
    B2 --> C2
    C2 --> D1
    D1 <-->|Bi-directional WS| E2
    E2 --> E1
    E2 --> E3
    Backend_Core <--> D2
```

---

### 💳 Paper Trading Order Execution Flow

```mermaid
sequenceDiagram
    autonumber
    actor Trader as User / Client
    participant API as Express API (/api/paper-trading)
    participant Engine as PaperTradingService
    participant DB as PostgreSQL (Prisma $transaction)
    participant WS as WebSocket Gateway

    Trader->>API: POST /orders (Symbol, Type, Quantity, Price)
    API->>Engine: Validate Order Parameters & Authorization
    Engine->>DB: Fetch Cash Balance & Current Holdings
    alt Insufficient Balance / Shares
        DB-->>Engine: Validation Error
        Engine-->>API: 400 Bad Request (Insufficient Funds)
        API-->>Trader: Order Rejected Message
    else Valid Order
        Engine->>DB: Atomic Execution (Deduct Cash, Upsert Holding, Create Order & Transaction)
        DB-->>Engine: Order Filled Successfully
        Engine->>WS: Broadcast Portfolio Update Event
        Engine-->>API: 201 Created (Order Receipt)
        API-->>Trader: Order Confirmation & Updated Balance
    end
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite 6 | Modern, lightning-fast SPA with instant HMR |
| **Language** | TypeScript 5.3+ | End-to-end type safety across backend and frontend |
| **Styling & Theme** | Tailwind CSS 3.4 + Lucide Icons | Bloomberg/TradingView inspired sleek dark terminal UI |
| **Financial Charting** | TradingView Lightweight Charts 4.1 | Hardware-accelerated canvas candlestick & volume charting |
| **Client State** | Zustand + TanStack Query | Performant global client state and asynchronous data caching |
| **Backend Runtime** | Node.js 20 LTS + Express 4.18 | Event-driven REST API and real-time WebSocket server |
| **Real-Time Streaming**| Native WebSockets (`ws`) + Redis Pub/Sub | Low-latency tick broadcast with channel subscription filtering |
| **Database & ORM** | PostgreSQL 16 / SQLite + Prisma ORM | Relational schema with migrations and ACID transaction support |
| **Caching & In-Memory**| Redis 7.0 Alpine | High-speed price caching and multi-instance Pub/Sub messaging |
| **Authentication** | Google OAuth 2.0 (GIS) + JWT + Bcrypt | Secure token verification and password encryption |
| **Containerization** | Docker + Docker Compose + Nginx | Production multi-container orchestration |
| **Testing** | Jest + Supertest + Vitest | Comprehensive indicator and authentication unit testing |

---

## 📂 Project Structure

```text
QuantFlow/
├── backend/
│   ├── data/                          # Cached instrument master files (auto-generated)
│   ├── prisma/
│   │   └── schema.prisma              # Database schema (Users, Orders, Portfolios, etc.)
│   ├── src/
│   │   ├── config/                    # Environment & runtime configuration
│   │   ├── controllers/               # REST API route controllers
│   │   │   ├── alertsController.ts
│   │   │   ├── authController.ts
│   │   │   ├── calendarController.ts
│   │   │   ├── communityController.ts
│   │   │   ├── cryptoController.ts
│   │   │   ├── forexController.ts
│   │   │   ├── futuresController.ts
│   │   │   ├── newsController.ts
│   │   │   ├── paperTradingController.ts
│   │   │   ├── stockController.ts
│   │   │   └── watchlistController.ts
│   │   ├── database/                  # Prisma client instance & seeding
│   │   ├── indicators/                # Technical indicator computation engine
│   │   │   ├── __tests__/             # Unit tests for SMA, EMA, RSI, MACD, etc.
│   │   │   └── index.ts
│   │   ├── middleware/                # JWT Auth, Rate Limiter, Error Handlers
│   │   ├── providers/                 # Multi-source market data connectors
│   │   │   ├── BinanceCryptoDataProvider.ts
│   │   │   ├── FinnhubMarketDataProvider.ts
│   │   │   ├── ForexDataProvider.ts
│   │   │   ├── FuturesDataProvider.ts
│   │   │   ├── MarketDataNormalizer.ts
│   │   │   ├── MarketDataProviderRouter.ts
│   │   │   ├── MockMarketDataProvider.ts
│   │   │   ├── NewsProvider.ts
│   │   │   └── UpstoxMarketDataProvider.ts
│   │   ├── redis/                     # Redis client & Pub/Sub event bus
│   │   ├── routes/                    # Express route definitions
│   │   ├── services/                  # Business logic services
│   │   │   ├── __tests__/             # Auth & Google OAuth unit tests
│   │   │   ├── alertService.ts
│   │   │   ├── authService.ts
│   │   │   ├── calendarService.ts
│   │   │   ├── communityService.ts
│   │   │   ├── instrumentService.ts
│   │   │   ├── marketIngestionService.ts
│   │   │   ├── newsService.ts
│   │   │   ├── paperTradingService.ts
│   │   │   ├── stockService.ts
│   │   │   ├── SymbolResolver.ts
│   │   │   ├── upstoxInstrumentService.ts
│   │   │   └── watchlistService.ts
│   │   ├── types/                     # Shared TypeScript interfaces & types
│   │   ├── utils/                     # JWT signing & helper utilities
│   │   ├── websocket/                 # WebSocket server & subscription manager
│   │   ├── app.ts                     # Express application configuration
│   │   └── server.ts                  # Server entrypoint & initialization
│   ├── Dockerfile                     # Production backend container definition
│   ├── jest.config.js                 # Jest test runner configuration
│   ├── package.json                   # Backend dependencies & npm scripts
│   ├── tsconfig.json                  # TypeScript compiler configuration
│   └── .env.example                   # Environment configuration template
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg                # Application icon
│   ├── src/
│   │   ├── charts/                    # Lightweight Charts financial components
│   │   │   └── FinancialChart.tsx
│   │   ├── components/                # Reusable modular UI components
│   │   │   ├── auth/                  # Google login & protected route wrappers
│   │   │   ├── common/                # Navbar, Sidebar, Badges, Search Modals
│   │   │   ├── news/                  # Market news feed components
│   │   │   ├── stock/                 # Indicators, Timeframe bars, Headers
│   │   │   └── trading/               # Quick trade execution panel
│   │   ├── hooks/                     # Custom React hooks (useRealtimeQuote, etc.)
│   │   ├── layouts/                   # Main & Terminal dashboard layouts
│   │   ├── pages/                     # Application route views
│   │   │   ├── AlertsPage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── CommunityPage.tsx
│   │   │   ├── CryptoPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── EconomicCalendarPage.tsx
│   │   │   ├── ForexPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── FuturesPage.tsx
│   │   │   ├── IPOCalendarPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── MarketsPage.tsx
│   │   │   ├── NewsPage.tsx
│   │   │   ├── PaperTradingPage.tsx
│   │   │   ├── PortfolioPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ResetPasswordPage.tsx
│   │   │   ├── ScreenerPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── StockDetailPage.tsx
│   │   │   └── WatchlistPage.tsx
│   │   ├── services/                  # Axios HTTP client with JWT interceptors
│   │   ├── store/                     # Zustand state stores (Market, Auth, Portfolio)
│   │   ├── types/                     # Frontend TypeScript models
│   │   ├── utils/                     # Number, currency, and date formatters
│   │   ├── websocket/                 # Client-side WebSocket manager & reconnect
│   │   ├── App.tsx                    # Root routing & layout setup
│   │   ├── index.css                  # Global Tailwind CSS & typography styles
│   │   └── main.tsx                   # React DOM bootstrapping
│   ├── Dockerfile                     # Production frontend container definition
│   ├── nginx.conf                     # Production Nginx reverse proxy configuration
│   ├── package.json                   # Frontend dependencies & npm scripts
│   ├── postcss.config.js              # PostCSS configuration
│   ├── tailwind.config.js             # Tailwind theme & color token definitions
│   ├── tsconfig.json                  # Frontend TypeScript configuration
│   ├── vite.config.ts                 # Vite bundler & API proxy configuration
│   └── .env.example                   # Frontend environment template
│
├── docker-compose.yml                 # Multi-container orchestration (Stack setup)
├── .gitignore                         # Comprehensive Git ignore specifications
└── README.md                          # Repository documentation
```

---

## 🗄️ Database Architecture (Prisma ORM)

```mermaid
erDiagram
    User ||--o{ Watchlist : "creates"
    User ||--o| Portfolio : "owns"
    User ||--o{ Order : "places"
    User ||--o{ Transaction : "executes"
    User ||--o| UserPreference : "configures"
    User ||--o{ Alert : "sets"
    User ||--o{ TradeIdea : "publishes"
    User ||--o{ Comment : "posts"

    Watchlist ||--o{ WatchlistItem : "contains"
    Portfolio ||--o{ Holding : "tracks"
    Order ||--o| Transaction : "generates"
    TradeIdea ||--o{ Comment : "receives"

    User {
        string id PK
        string email UK
        string passwordHash
        string name
        string authProvider
        string googleId UK
        decimal virtualCash
        datetime createdAt
    }

    Portfolio {
        string id PK
        string userId FK
        decimal cashBalance
        decimal investedAmount
        decimal realizedPnL
    }

    Holding {
        string id PK
        string portfolioId FK
        string symbol
        decimal quantity
        decimal averageBuyPrice
    }

    Order {
        string id PK
        string userId FK
        string symbol
        string type
        string status
        decimal price
        decimal quantity
        decimal totalAmount
    }

    Alert {
        string id PK
        string userId FK
        string symbol
        decimal targetPrice
        string condition
        boolean isActive
    }

    TradeIdea {
        string id PK
        string userId FK
        string symbol
        string title
        string description
        int likesCount
    }
```

---

## 🌐 API Overview

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new user with email and password | No |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT token | No |
| `POST` | `/api/auth/google` | Verify Google OAuth 2.0 ID token & create/link user | No |
| `POST` | `/api/auth/forgot-password` | Request password reset token | No |
| `POST` | `/api/auth/reset-password` | Set new password using reset token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |

### Market Data & Quotes (`/api/stocks`, `/api/crypto`, `/api/forex`, `/api/futures`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/stocks/quote/:symbol` | Fetch real-time quote for a specific ticker | No |
| `GET` | `/api/stocks/candles/:symbol` | Historical OHLCV candle data (multi-timeframe) | No |
| `GET` | `/api/stocks/screener` | Filter global stocks by multiple fundamental metrics | No |
| `GET` | `/api/stocks/search` | Search symbols and companies across exchanges | No |
| `GET` | `/api/crypto/list` | List cryptocurrency pairs with live stats | No |
| `GET` | `/api/forex/list` | List major currency pairs with live exchange rates | No |
| `GET` | `/api/futures/list` | List futures contracts and commodities | No |

### Paper Trading & Portfolio (`/api/paper-trading`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/paper-trading/portfolio` | Get virtual balance, holdings & unrealized PnL | Yes |
| `POST` | `/api/paper-trading/orders` | Place virtual MARKET or LIMIT order | Yes |
| `GET` | `/api/paper-trading/orders` | Fetch order history | Yes |
| `GET` | `/api/paper-trading/transactions` | Fetch completed transactions ledger | Yes |
| `POST` | `/api/paper-trading/reset` | Reset virtual balance back to $100,000 | Yes |

### Watchlists & Price Alerts (`/api/watchlists`, `/api/alerts`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/watchlists` | Retrieve all custom user watchlists | Yes |
| `POST` | `/api/watchlists` | Create new custom watchlist | Yes |
| `POST` | `/api/watchlists/:id/items` | Add symbol to watchlist | Yes |
| `DELETE` | `/api/watchlists/:id/items/:symbol`| Remove symbol from watchlist | Yes |
| `GET` | `/api/alerts` | List active price alerts for user | Yes |
| `POST` | `/api/alerts` | Create new price boundary alert (`ABOVE`/`BELOW`) | Yes |
| `DELETE` | `/api/alerts/:id` | Cancel/delete a price alert | Yes |

### WebSocket Gateway Protocol (`ws://localhost:5000/ws`)
```json
// 1. Subscribe to real-time ticker stream:
{ "type": "SUBSCRIBE", "symbol": "AAPL" }

// 2. Server broadcast tick event:
{
  "type": "TICK",
  "symbol": "AAPL",
  "data": {
    "price": 182.50,
    "change": 1.75,
    "changePercent": 0.97,
    "volume": 42500120,
    "high": 183.10,
    "low": 180.40,
    "open": 181.00,
    "previousClose": 180.75,
    "timestamp": 1709000000000
  }
}

// 3. Unsubscribe from ticker stream:
{ "type": "UNSUBSCRIBE", "symbol": "AAPL" }
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js** (v18.0.0 or higher) & **npm** (v9.0.0 or higher)
- **Git** installed on your machine
- **Docker & Docker Compose** *(Optional, for single-command stack deployment)*

---

### Option A: Run with Docker Compose (Recommended)

To spin up the entire production stack (PostgreSQL + Redis + Node.js Backend API + Nginx React Frontend):

```bash
# 1. Clone the repository
git clone https://github.com/your-username/QuantFlow.git
cd QuantFlow

# 2. Launch containerized services
docker-compose up --build
```

#### Service URLs:
- 💻 **Frontend Web App**: `http://localhost:3000`
- 📡 **Backend REST API**: `http://localhost:5000/api`
- 🔌 **WebSocket Server**: `ws://localhost:5000/ws`

---

### Option B: Run Locally in Development Mode

#### 1. Setup Backend Server

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Generate Prisma Client & push schema
npx prisma generate
npx prisma db push

# Start backend development server
npm run dev
```

The backend server will start at:
- **REST API**: `http://localhost:5000`
- **WebSocket Gateway**: `ws://localhost:5000/ws`

---

#### 2. Setup Frontend Application

Open a **new terminal window**:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start Vite development server
npm run dev
```

Open your browser at:
👉 **`http://localhost:5173`** (or `http://localhost:5174`)

---

## 🔐 Environment Variables

### Backend Configuration (`backend/.env`)

```env
# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173,http://localhost:5174,http://localhost:3000"

# Database & Cache
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/quantflow?schema=public"
REDIS_URL="redis://localhost:6379"

# Security
JWT_SECRET="your_jwt_super_secret_signing_key_change_in_production"

# Google OAuth 2.0
GOOGLE_CLIENT_ID="your_google_web_oauth_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_web_oauth_client_secret"

# Market Data Providers (Optional / Fallback to Built-in Stochastic GBM Simulator)
MARKET_DATA_PROVIDER="real"
FINNHUB_API_KEY="your_finnhub_api_key"
UPSTOX_API_KEY="your_upstox_api_key"
UPSTOX_ACCESS_TOKEN="your_upstox_access_token"
NEWS_API_KEY="your_news_api_key"
TWELVE_DATA_API_KEY="your_twelve_data_api_key"
```

### Frontend Configuration (`frontend/.env`)

```env
# Google OAuth 2.0 Web Client ID
VITE_GOOGLE_CLIENT_ID="your_google_web_oauth_client_id.apps.googleusercontent.com"

# API & WebSocket Endpoints
VITE_API_BASE_URL="http://localhost:5000/api"
VITE_WS_URL="ws://localhost:5000/ws"
```

---

## 🔑 Google OAuth 2.0 Setup

QuantFlow utilizes the modern **Google Identity Services (GIS)** ID-token authentication flow:

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project and configure the **OAuth consent screen**.
3. Create credentials: **OAuth 2.0 Client ID** (Application type: **Web application**).
4. Add **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - `http://localhost:5174`
   - `http://localhost:3000`
5. Copy your **Client ID** and **Client Secret** into `frontend/.env` and `backend/.env`.

---

## 🧪 Running Automated Tests

QuantFlow includes unit test suites covering the technical indicators computation engine, mathematical formulas, and Google OAuth token verification:

```bash
cd backend
npm test
```

Expected output:
```text
PASS src/indicators/__tests__/indicators.test.ts
PASS src/services/__tests__/authGoogle.test.ts

Test Suites: 2 passed, 2 total
Tests:       15 passed, 15 total
Snapshots:   0 total
```

---

## 🗺️ Future Roadmap

- [ ] **Options Analytics & Greeks Calculator**: Real-time Delta, Gamma, Theta, Vega computations and payoff diagrams.
- [ ] **Backtesting Engine**: Python/Wasm integration to execute historical quantitative strategy simulations.
- [ ] **Algorithmic Webhooks**: Webhook triggers for TradingView alert integrations into virtual execution.
- [ ] **AI Market Copilot**: LLM-assisted financial statement analysis and automated technical chart pattern recognition.
- [ ] **Multi-Currency Virtual Portfolios**: Support for INR, EUR, and GBP denominated paper accounts.

---

## 👨‍💻 Author & Contributions

Created with ❤️ by **Akhil Shah**

- **GitHub**: [@akhilshah](https://github.com/)
- **LinkedIn**: [Akhil Shah](https://linkedin.com/)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
