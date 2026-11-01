# NovaSales Analytics Dashboard

A modern, high-performance sales analytics dashboard built with **Vanilla HTML, CSS (strictly zero CSS variables), and JavaScript** with **WebStorage (localStorage)** persistence.

![Dashboard Preview](https://img.shields.io/badge/Platform-Web-blue)
![Dependencies](https://img.shields.io/badge/Dependencies-Zero%20Build%20Tools-success)
![Storage](https://img.shields.io/badge/Storage-WebStorage%20(localStorage)-orange)

---

## Features

- **Executive KPI Cards**: Real-time Gross Revenue, Total Orders, Average Order Value (AOV), and Completion Rate with period-over-period trend badges (+/- %).
- **Interactive Visualizations** (Chart.js):
  - **Revenue & Target Trajectory**: Smooth spline area chart tracking revenue against target quotas.
  - **Sales by Category**: Cutout doughnut breakdown of sales across product verticals.
  - **Acquisition Channels**: Funnel analysis across direct sales, online store, inbound, and partner referrals.
  - **Regional Distribution**: Horizontal bar chart comparing regional revenue performance.
- **Deep-Dive Performance Metrics**:
  - Top 5 grossing products and solutions.
  - Sales representative leaderboard with quota achievement progress.
- **Transactions Ledger**:
  - Live search across customer name, email, product, and transaction ID.
  - Category and status filters (Completed, Pending, Refunded).
  - Sortable columns and customizable table pagination.
  - Action buttons to inspect detailed receipts or delete transactions.
- **Complete Transaction Management**:
  - "Record Sale" modal with validation and instant localStorage sync.
  - Receipt modal with refund toggle.
  - Multi-currency switcher ($ USD, € EUR, £ GBP).
  - Date range filters (Today, Last 7 Days, Last 30 Days, Last 90 Days, All Time, Custom Range).
  - One-click CSV report export.
  - Demo data reset button.

---

## Technical Specifications

- **Frontend**: Vanilla HTML5, Vanilla JavaScript (ES6+), Vanilla CSS.
- **Design Constraint**: Strictly **zero CSS variables** (direct explicit styling).
- **Persistence**: Browser `localStorage` (no backend required).
- **Charts**: Chart.js 4.4.1 (via CDN).
- **Fonts**: Inter via Google Fonts.

---

## Quick Start

Open `index.html` directly in any modern web browser or serve via any static HTTP server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve .
```

Then visit `http://localhost:8000` in your browser.
