# QuantFlow - Real-Time Stock Market Analytics Terminal & Paper Trading Platform

QuantFlow is a production-grade, real-time financial market analytics platform built with **React**, **Vite**, **TypeScript**, **Node.js**, **Express**, **WebSocket**, **Redis**, **PostgreSQL**, and **Prisma ORM**.

---

## 🌟 Key Features

- 📊 **Interactive Candlestick Charting**: Multi-timeframe analysis (`1m`, `5m`, `15m`, `30m`, `1H`, `4H`, `1D`, `1W`, `1M`, `1Y`, `MAX`) using Lightweight Charts with volume overlays.
- 📐 **Technical Indicators**: Reusable indicator service supporting **SMA** (20, 50), **EMA** (12, 26), **RSI** (14), **MACD**, **Bollinger Bands**, **VWAP**, and **ATR (14)**.
- ⚡ **Real-Time Data Pipeline**: WebSockets + Redis Pub/Sub broadcast ticks to subscribed clients with explicit market status indicators (**LIVE**, **DELAYED**, **MARKET CLOSED**, **DISCONNECTED**).
- 🔍 **Stock Screener & Analytics**: Screen equities across global exchanges (**NASDAQ**, **NYSE**, **NSE**, **BSE**, **LSE**, **DAX**, **Nikkei**, **HKEX**) by valuation multiples, sector, and dividend yield.
- 💵 **Paper Trading Engine**: Virtual cash balance ($100,000) supporting instant **MARKET** orders and target **LIMIT** orders (`BUY_LIMIT`, `SELL_LIMIT`) with real-time mark-to-market P/L calculation.
- 📑 **Custom Watchlists**: Create, re-order, and stream real-time price changes across custom stock watchlists.
- 🐳 **Full Dockerization**: Single-command container orchestration (`docker-compose up`).

---

## 🏗️ Architecture Overview

```text
Market Data Provider (Stochastic GBM Generator / Finnhub API)
                  │
                  ▼
       Node.js Data Ingestion
                  │
         Updates Redis State
                  │
        Publishes to Pub/Sub
                  │
        Express WebSocket Gateway (/ws)
                  │ (SUBSCRIBE / UNSUBSCRIBE filtering)
                  ▼
         React Client + Lightweight Charts
```

---

## 🚀 How to Run the Application

### Prerequisites

- **Node.js** v18+ and **npm** v9+ installed
- **Docker Desktop** (Optional, recommended for single-command stack execution)

---

### Option 1: Run with Docker Compose (Recommended - Starts Everything)

Run the entire full-stack application (PostgreSQL + Redis + Node.js Backend + Nginx Frontend) with one single command:

```bash
docker-compose up --build
```

#### Access Links:
- 💻 **Frontend Web App**: `http://localhost:3000`
- 📡 **Backend REST API**: `http://localhost:5000/api`
- 🔌 **WebSocket Gateway**: `ws://localhost:5000/ws`

---

### Option 2: Run Locally in Development Mode

> [!IMPORTANT]
> Both **Backend** and **Frontend** servers must be running simultaneously in **two separate terminal windows**.

#### Terminal Window 1: Start the Backend API & WebSocket Gateway

```bash
cd backend
npm install
npx prisma generate
npm run dev
```

You will see:
```text
=======================================================
🚀 QuantFlow Backend Running on http://localhost:5000
📡 WebSocket Gateway Listening at ws://localhost:5000/ws
=======================================================
```

---

#### Terminal Window 2: Start the Frontend React Client

Open a second terminal window:

```bash
cd frontend
npm install
npm run dev
```

Open your browser at:
👉 **`http://localhost:5173`**

---

## 🔐 How to Log In

Once both servers are running:

1. Open `http://localhost:5173`.
2. Click **⚡ ONE-CLICK DEMO ACCOUNT LOGIN** on the login page for instant access with a pre-configured **$100,000** paper trading balance.
3. Or enter any email address (e.g. `akhilshah179@gmail.com`) and click **SIGN IN** to log in automatically.

---

## 🧪 Running Unit Tests

To run the technical indicator and calculation test suite:

```bash
cd backend
npm test
```

Expected output:
```text
PASS src/indicators/__tests__/indicators.test.ts
  Technical Indicators Calculation Unit Tests
    ✓ calculateSMA should return correct period average
    ✓ calculateEMA should weight recent candles higher
    ✓ calculateRSI should return values between 0 and 100
    ✓ calculateMACD should return valid macd, signal, and histogram
    ✓ calculateBollingerBands should calculate upper > middle > lower
    ✓ calculateVWAP should calculate volume weighted price
    ✓ calculateATR should calculate average true range

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```

---

## 🔒 Security & Optimization Highlights

- **JWT Authentication**: Secure token verification for REST endpoints & WebSocket sessions.
- **ACID Database Transactions**: Paper trading orders execute inside Prisma `$transaction` blocks.
- **Efficient WebSocket Subscriptions**: Ticks are streamed only for symbols explicitly subscribed to by active clients.
