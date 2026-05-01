# Monte Claro — Monte Carlo Stock Market Simulator

> A professional-grade Monte Carlo simulator built in **C** with a modern **React + TypeScript** web interface. Simulate thousands of stock price paths using Geometric Brownian Motion, analyze risk metrics, import real historical data, and export a styled PDF report.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Tech](https://img.shields.io/badge/stack-C%20%7C%20React%20%7C%20TypeScript%20%7C%20Vite-blueviolet)

---

## ✨ Features

- 📈 **Geometric Brownian Motion** — Industry-standard GBM model for realistic price path simulation
- 🔁 **10,000+ Simulations** — Run up to 50,000 Monte Carlo paths in real time, directly in the browser
- 📂 **CSV Import** — Upload historical stock data (Yahoo Finance, Google Sheets, Nasdaq) to auto-calculate real-world volatility and expected return
- 📊 **Interactive Charts** — Visualize simulated price paths with a rich Recharts graph
- 📉 **Risk Metrics** — Value at Risk (VaR 95%), 95%/99% Confidence Intervals, Probability of Profit/Loss
- 📄 **PDF Export** — Export a beautifully styled, print-ready simulation report
- 🌙 **Premium Dark UI** — Glassmorphism design with smooth animations

---

## 🗂 Project Structure

```
Monte_Claro/
├── src/                    # C source files
│   ├── main.c              # Entry point — runs 3 preset scenarios
│   ├── monte_carlo.c       # Core simulation engine (GBM, statistics)
│   └── monte_carlo.h       # Shared types and function declarations
├── results/                # Output CSV files from the C simulation
├── frontend/               # React + TypeScript web application
│   ├── src/
│   │   ├── lib/
│   │   │   ├── monteCarlo.ts   # Browser simulation engine (mirrors C logic)
│   │   │   └── csvParser.ts    # Historical CSV parser & stats calculator
│   │   ├── App.tsx             # Main UI application
│   │   └── index.css           # Premium dark mode design system
│   ├── AAPL.csv            # Sample stock data for testing
│   └── package.json
├── Makefile                # C build configuration
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Getting Started

### Web Application (Recommended)

```bash
cd frontend
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### C Command-Line Simulator

Requires GCC and Make.

```bash
make          # Compile the project
make run      # Compile and run all 3 scenarios
make clean    # Remove build artifacts
```

Results are saved to `results/` as CSV files.

---

## 📥 Using CSV Import

The web app accepts standard historical stock CSVs. Download data from:

- **Google Sheets** — `=GOOGLEFINANCE("AAPL", "price", TODAY()-365, TODAY(), "DAILY")` → File → Download as CSV
- **Nasdaq** — [nasdaq.com](https://www.nasdaq.com) → Search ticker → Historical Data → Download
- **MarketWatch** — [marketwatch.com](https://www.marketwatch.com) → Historical Quotes → Download

The CSV must contain a `Close` or `Adj Close` column. The app will automatically calculate:
- **Initial Price** — Most recent closing price
- **Annualized Expected Return** — From mean daily log returns × 252
- **Annualized Volatility** — From std dev of daily log returns × √252

---

## 📄 PDF Export

Click **"Export PDF"** to open a print preview of your full simulation report, including:
- Key metrics (Mean Price, VaR, Profit probability)
- Price statistics and confidence intervals
- Returns analysis

In the print dialog, choose **"Save as PDF"** as the destination.

> **Note:** Allow pop-ups for the app if prompted by your browser.

---

## 🧮 Mathematical Model

The simulator uses **Geometric Brownian Motion (GBM)**:

```
dS = μ·S·dt + σ·S·dW
```

Implemented as the discrete log-return form:

```
S(t+1) = S(t) · exp((μ - σ²/2)·dt + σ·√dt·ε)
```

Where `ε ~ N(0,1)` is generated using the **Box-Muller transform**.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Simulation Engine (CLI) | C, GCC, GNU Make |
| Simulation Engine (Web) | TypeScript |
| Frontend Framework | React 19 + Vite |
| Charting | Recharts |
| Icons | Lucide React |
| Styling | Vanilla CSS (Glassmorphism) |

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.
