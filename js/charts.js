/**
 * Sales Analytics Dashboard - Visual Charts Controller (Chart.js)
 */

let revenueChartInstance = null;
let categoryChartInstance = null;
let channelChartInstance = null;
let regionalChartInstance = null;

// Initialize or Update All Charts
function renderDashboardCharts(transactions, currency = 'USD') {
  renderRevenueTrendChart(transactions, currency);
  renderCategoryDoughnutChart(transactions, currency);
  renderChannelBarChart(transactions, currency);
  renderRegionalChart(transactions, currency);
}

// 1. Revenue & Target Trend Line/Area Chart
function renderRevenueTrendChart(transactions, currency = 'USD') {
  const canvas = document.getElementById('revenueTrendChart');
  if (!canvas) return;

  // Aggregate daily revenue from completed transactions
  const dateMap = {};
  
  // Sort ascending for chronological line chart
  const sorted = [...transactions]
    .filter(t => t.status === 'Completed')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (sorted.length === 0) {
    // fallback if no data
    dateMap['No Data'] = 0;
  } else {
    sorted.forEach(t => {
      const d = new Date(t.date);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateMap[key] = (dateMap[key] || 0) + t.amount;
    });
  }

  const labels = Object.keys(dateMap);
  const values = Object.values(dateMap);

  // Generate target line (e.g. 10% higher than average or smoothed baseline)
  const avgVal = values.reduce((a, b) => a + b, 0) / (values.length || 1);
  const targetValues = values.map(() => Math.round(avgVal * 1.12));

  if (revenueChartInstance) {
    revenueChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(79, 70, 229, 0.45)');
  gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

  revenueChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Actual Revenue',
          data: values,
          borderColor: '#6366f1',
          borderWidth: 3,
          backgroundColor: gradient,
          fill: true,
          tension: 0.38,
          pointBackgroundColor: '#818cf8',
          pointBorderColor: '#1e1b4b',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Revenue Target',
          data: targetValues,
          borderColor: '#06b6d4',
          borderWidth: 2,
          borderDash: [5, 5],
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: '#94a3b8',
            boxWidth: 12,
            boxHeight: 12,
            usePointStyle: true,
            font: { size: 12, family: 'Inter' }
          }
        },
        tooltip: {
          backgroundColor: '#111827',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: function(context) {
              const val = context.parsed.y;
              return `${context.dataset.label}: ${formatCurrency(val, currency)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(51, 65, 85, 0.3)',
            tickColor: 'transparent'
          },
          ticks: {
            color: '#64748b',
            font: { size: 11, family: 'Inter' },
            maxRotation: 45
          }
        },
        y: {
          grid: {
            color: 'rgba(51, 65, 85, 0.3)',
            tickColor: 'transparent'
          },
          ticks: {
            color: '#64748b',
            font: { size: 11, family: 'Inter' },
            callback: function(value) {
              return formatCurrency(value, currency);
            }
          }
        }
      }
    }
  });
}

// 2. Sales by Category Doughnut Chart
function renderCategoryDoughnutChart(transactions, currency = 'USD') {
  const canvas = document.getElementById('categoryDoughnutChart');
  if (!canvas) return;

  const categoryMap = {};
  CATEGORIES.forEach(c => { categoryMap[c] = 0; });

  transactions
    .filter(t => t.status === 'Completed')
    .forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

  const labels = Object.keys(categoryMap);
  const data = Object.values(categoryMap);

  const colors = [
    '#6366f1', // Indigo
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6'  // Purple
  ];

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: '#0f172a',
        borderWidth: 3,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94a3b8',
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            font: { size: 11, family: 'Inter' },
            padding: 14
          }
        },
        tooltip: {
          backgroundColor: '#111827',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              const val = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((val / total) * 100) : 0;
              return `${context.label}: ${formatCurrency(val, currency)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// 3. Sales by Acquisition Channel Bar Chart
function renderChannelBarChart(transactions, currency = 'USD') {
  const canvas = document.getElementById('channelBarChart');
  if (!canvas) return;

  const channelMap = {};
  CHANNELS.forEach(ch => { channelMap[ch] = 0; });

  transactions
    .filter(t => t.status === 'Completed')
    .forEach(t => {
      channelMap[t.channel] = (channelMap[t.channel] || 0) + t.amount;
    });

  const labels = Object.keys(channelMap);
  const data = Object.values(channelMap);

  if (channelChartInstance) {
    channelChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  channelChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Revenue',
        data: data,
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        hoverBackgroundColor: 'rgba(99, 102, 241, 0.95)',
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#111827',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(context) {
              return `Revenue: ${formatCurrency(context.parsed.y, currency)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#64748b',
            font: { size: 11, family: 'Inter' }
          }
        },
        y: {
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: {
            color: '#64748b',
            font: { size: 11, family: 'Inter' },
            callback: function(value) {
              return formatCurrency(value, currency);
            }
          }
        }
      }
    }
  });
}

// 4. Regional Distribution Chart
function renderRegionalChart(transactions, currency = 'USD') {
  const canvas = document.getElementById('regionalChart');
  if (!canvas) return;

  const regionMap = {};
  REGIONS.forEach(r => { regionMap[r] = 0; });

  transactions
    .filter(t => t.status === 'Completed')
    .forEach(t => {
      regionMap[t.region] = (regionMap[t.region] || 0) + t.amount;
    });

  const labels = Object.keys(regionMap);
  const data = Object.values(regionMap);

  if (regionalChartInstance) {
    regionalChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  regionalChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Regional Revenue',
        data: data,
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(6, 182, 212, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ],
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y', // Horizontal bars
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#111827',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(context) {
              return `Revenue: ${formatCurrency(context.parsed.x, currency)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(51, 65, 85, 0.3)' },
          ticks: {
            color: '#64748b',
            font: { size: 10, family: 'Inter' },
            callback: function(value) {
              return formatCurrency(value, currency);
            }
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            color: '#94a3b8',
            font: { size: 11, family: 'Inter' }
          }
        }
      }
    }
  });
}
