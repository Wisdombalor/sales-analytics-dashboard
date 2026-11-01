/**
 * Sales Analytics Dashboard - Data Engine & LocalStorage Manager
 */

const STORAGE_KEY = 'novasales_analytics_transactions_v2';
const SETTINGS_KEY = 'novasales_analytics_settings_v2';

// Currency exchange rates for display purposes (relative to USD)
const CURRENCY_CONFIG = {
  USD: { symbol: '$', rate: 1.0, locale: 'en-US' },
  EUR: { symbol: '€', rate: 0.92, locale: 'de-DE' },
  GBP: { symbol: '£', rate: 0.79, locale: 'en-GB' }
};

// Default Sales Reps & Categories
const CATEGORIES = ['Software', 'Hardware', 'Cloud Services', 'Consulting', 'Peripherals'];
const CHANNELS = ['Direct Sales', 'Online Store', 'Partner Referral', 'Enterprise Inbound'];
const REGIONS = ['North America', 'Europe', 'Asia-Pacific', 'Latin America'];
const REPS = [
  { name: 'Elena Rostova', quota: 65000 },
  { name: 'Marcus Vance', quota: 55000 },
  { name: 'Devon Miles', quota: 48000 },
  { name: 'Chloe Bennett', quota: 42000 }
];

// Seed generator to provide rich, realistic, chronological transaction data
function generateSeedData() {
  const seedProducts = [
    { name: 'Enterprise Cloud Suite', category: 'Cloud Services', basePrice: 2400 },
    { name: '4K Ultra-wide Professional Monitor', category: 'Hardware', basePrice: 850 },
    { name: 'DevOps Automated Pipeline License', category: 'Software', basePrice: 1600 },
    { name: 'Ergonomic Mesh Task Chair', category: 'Peripherals', basePrice: 420 },
    { name: 'Cybersecurity Architecture Audit', category: 'Consulting', basePrice: 3800 },
    { name: 'AI Assistant Team Subscription', category: 'Software', basePrice: 590 },
    { name: 'Smart Video Conference Bar 4K', category: 'Hardware', basePrice: 1200 },
    { name: 'Data Pipeline Engineering Retainer', category: 'Consulting', basePrice: 4500 },
    { name: 'Mechanical Noise-Dampened Keyboard', category: 'Peripherals', basePrice: 180 },
    { name: 'Serverless Infrastructure Tier 3', category: 'Cloud Services', basePrice: 1950 },
    { name: 'Multi-Tenant Auth Gateway', category: 'Software', basePrice: 890 },
    { name: 'Wireless Active Noise-Canceling Headset', category: 'Peripherals', basePrice: 290 }
  ];

  const seedCustomers = [
    { name: 'Astra Dynamics Inc', email: 'billing@astradynamics.io' },
    { name: 'Quantum Core Labs', email: 'accounts@quantumcore.tech' },
    { name: 'Vanguard Retail Systems', email: 'finance@vanguardretail.com' },
    { name: 'Helix BioInformatics', email: 'operations@helixbio.org' },
    { name: 'Apex Capital Partners', email: 'procurement@apexcap.com' },
    { name: 'Horizon Cloud Networks', email: 'admin@horizoncloud.net' },
    { name: 'Starlight Media Studios', email: 'sales@starlightmedia.com' },
    { name: 'BluePeak Analytics Ltd', email: 'billing@bluepeakanalytics.co' },
    { name: 'Solaris Autonomous Tech', email: 'orders@solarisai.io' },
    { name: 'Echo Stream Media', email: 'finance@echostream.tv' },
    { name: 'Nexus Logistics Global', email: 'supply@nexuslogistics.com' },
    { name: 'Summit Wealth Advisors', email: 'info@summitwealth.com' }
  ];

  const now = new Date('2026-11-01T18:00:00Z');
  const transactions = [];

  // Generate 55 transactions spanning over the last 60 days
  for (let i = 1; i <= 55; i++) {
    const daysAgo = Math.floor(Math.pow(Math.random(), 1.4) * 58); // higher density in recent days
    const hoursAgo = Math.floor(Math.random() * 24);
    const txnDate = new Date(now.getTime() - (daysAgo * 86400000 + hoursAgo * 3600000));
    
    const prod = seedProducts[Math.floor(Math.random() * seedProducts.length)];
    const cust = seedCustomers[Math.floor(Math.random() * seedCustomers.length)];
    const rep = REPS[Math.floor(Math.random() * REPS.length)].name;
    const channel = CHANNELS[Math.floor(Math.random() * CHANNELS.length)];
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const qty = Math.random() > 0.8 ? Math.floor(Math.random() * 3) + 2 : 1;
    
    const statusRand = Math.random();
    let status = 'Completed';
    if (statusRand < 0.08) status = 'Pending';
    else if (statusRand < 0.12) status = 'Refunded';

    const baseAmount = prod.basePrice * qty;
    // slight variation
    const amount = Math.round(baseAmount * (1 + (Math.random() * 0.1 - 0.05)));

    transactions.push({
      id: `TXN-${10000 + i}`,
      customerName: cust.name,
      customerEmail: cust.email,
      product: prod.name,
      category: prod.category,
      channel: channel,
      region: region,
      salesRep: rep,
      quantity: qty,
      amount: amount,
      date: txnDate.toISOString(),
      status: status
    });
  }

  // Sort descending by date
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  return transactions;
}

// Storage Helpers
const SalesStorage = {
  getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        const initial = generateSeedData();
        this.saveAll(initial);
        return initial;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to read from localStorage:', e);
      return generateSeedData();
    }
  },

  saveAll(transactions) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to write to localStorage:', e);
    }
  },

  add(transaction) {
    const list = this.getAll();
    list.unshift(transaction);
    this.saveAll(list);
    return list;
  },

  delete(id) {
    const list = this.getAll().filter(item => item.id !== id);
    this.saveAll(list);
    return list;
  },

  update(id, updatedFields) {
    const list = this.getAll().map(item => {
      if (item.id === id) {
        return { ...item, ...updatedFields };
      }
      return item;
    });
    this.saveAll(list);
    return list;
  },

  reset() {
    const fresh = generateSeedData();
    this.saveAll(fresh);
    return fresh;
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },

  getSettings() {
    try {
      const settings = localStorage.getItem(SETTINGS_KEY);
      return settings ? JSON.parse(settings) : { currency: 'USD', dateFilter: 'last30' };
    } catch (e) {
      return { currency: 'USD', dateFilter: 'last30' };
    }
  },

  saveSettings(settings) {
    try {
      const current = this.getSettings();
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  }
};

// Currency Formatter
function formatCurrency(amountUSD, currency = 'USD') {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
  const converted = amountUSD * config.rate;
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(converted);
}

// Date Range Filtering
function filterTransactions(transactions, filterType, customStart = null, customEnd = null) {
  const now = new Date('2026-11-01T23:59:59Z'); // Reference baseline for dataset
  let startDate = null;
  let endDate = new Date(now);

  if (filterType === 'today') {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
  } else if (filterType === 'last7') {
    startDate = new Date(now.getTime() - 7 * 86400000);
  } else if (filterType === 'last30') {
    startDate = new Date(now.getTime() - 30 * 86400000);
  } else if (filterType === 'quarter') {
    startDate = new Date(now.getTime() - 90 * 86400000);
  } else if (filterType === 'all') {
    return transactions;
  } else if (filterType === 'custom' && customStart && customEnd) {
    startDate = new Date(customStart);
    endDate = new Date(customEnd);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // default last30
    startDate = new Date(now.getTime() - 30 * 86400000);
  }

  return transactions.filter(t => {
    const d = new Date(t.date);
    return d >= startDate && d <= endDate;
  });
}

// Calculate comparison stats (current period vs preceding period of equal length)
function calculateMetricsWithTrends(allTransactions, filterType, customStart = null, customEnd = null) {
  const now = new Date('2026-11-01T23:59:59Z');
  let currentStart, currentEnd = new Date(now);
  let periodDays = 30;

  if (filterType === 'today') {
    periodDays = 1;
    currentStart = new Date(now);
    currentStart.setHours(0, 0, 0, 0);
  } else if (filterType === 'last7') {
    periodDays = 7;
    currentStart = new Date(now.getTime() - 7 * 86400000);
  } else if (filterType === 'last30') {
    periodDays = 30;
    currentStart = new Date(now.getTime() - 30 * 86400000);
  } else if (filterType === 'quarter') {
    periodDays = 90;
    currentStart = new Date(now.getTime() - 90 * 86400000);
  } else if (filterType === 'custom' && customStart && customEnd) {
    currentStart = new Date(customStart);
    currentEnd = new Date(customEnd);
    currentEnd.setHours(23, 59, 59, 999);
    periodDays = Math.max(1, Math.round((currentEnd - currentStart) / 86400000));
  } else {
    // all time
    periodDays = 365;
    currentStart = new Date(0);
  }

  const currentPeriodTxns = allTransactions.filter(t => {
    const d = new Date(t.date);
    return d >= currentStart && d <= currentEnd;
  });

  const prevStart = new Date(currentStart.getTime() - periodDays * 86400000);
  const prevEnd = new Date(currentStart.getTime() - 1);
  const prevPeriodTxns = allTransactions.filter(t => {
    const d = new Date(t.date);
    return d >= prevStart && d <= prevEnd;
  });

  // KPI Calculations (Completed revenue only counts towards gross revenue)
  const currentCompleted = currentPeriodTxns.filter(t => t.status === 'Completed');
  const prevCompleted = prevPeriodTxns.filter(t => t.status === 'Completed');

  const currentRevenue = currentCompleted.reduce((sum, t) => sum + t.amount, 0);
  const prevRevenue = prevCompleted.reduce((sum, t) => sum + t.amount, 0);

  const currentOrders = currentPeriodTxns.length;
  const prevOrders = prevPeriodTxns.length;

  const currentAov = currentCompleted.length > 0 ? (currentRevenue / currentCompleted.length) : 0;
  const prevAov = prevCompleted.length > 0 ? (prevRevenue / prevCompleted.length) : 0;

  // Completion/Conversion rate
  const currentConvRate = currentOrders > 0 ? (currentCompleted.length / currentOrders) * 100 : 0;
  const prevConvRate = prevOrders > 0 ? (prevCompleted.length / prevOrders) * 100 : 0;

  function calcChange(curr, prev) {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }

  return {
    revenue: { value: currentRevenue, change: calcChange(currentRevenue, prevRevenue) },
    orders: { value: currentOrders, change: calcChange(currentOrders, prevOrders) },
    aov: { value: currentAov, change: calcChange(currentAov, prevAov) },
    conversionRate: { value: currentConvRate, change: Math.round(currentConvRate - prevConvRate) },
    filteredTransactions: currentPeriodTxns
  };
}
