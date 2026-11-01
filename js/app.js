/**
 * Sales Analytics Dashboard - Main Application Controller
 */

// Application State
const AppState = {
  allTransactions: [],
  currentCurrency: 'USD',
  dateFilter: 'last30',
  customStartDate: '',
  customEndDate: '',
  // Table filters & pagination
  tableSearch: '',
  tableCategory: 'all',
  tableStatus: 'all',
  tableSortCol: 'date',
  tableSortDir: 'desc',
  tableCurrentPage: 1,
  tablePageSize: 10,
  selectedTransaction: null
};

// DOM Content Loaded Handler
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Load persisted settings
  const settings = SalesStorage.getSettings();
  AppState.currentCurrency = settings.currency || 'USD';
  AppState.dateFilter = settings.dateFilter || 'last30';

  // Set currency selector value
  const currencySelect = document.getElementById('currencySelect');
  if (currencySelect) currencySelect.value = AppState.currentCurrency;

  // Set active date filter button
  setActiveDateFilterButton(AppState.dateFilter);

  // Load transactions from WebStorage
  AppState.allTransactions = SalesStorage.getAll();

  // Bind all event listeners
  bindEvents();

  // Initial render
  updateDashboard();
  showToast('Dashboard initialized with live local storage data', 'info');
}

// Bind UI Interactions
function bindEvents() {
  // Currency Selector
  const currencySelect = document.getElementById('currencySelect');
  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      AppState.currentCurrency = e.target.value;
      SalesStorage.saveSettings({ currency: AppState.currentCurrency });
      updateDashboard();
      showToast(`Currency changed to ${AppState.currentCurrency}`, 'info');
    });
  }

  // Date Filter Pills
  const filterPills = document.querySelectorAll('.filter-pill-btn');
  filterPills.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.dataset.filter;
      if (!filter) return;
      
      AppState.dateFilter = filter;
      SalesStorage.saveSettings({ dateFilter: filter });
      setActiveDateFilterButton(filter);

      const customContainer = document.getElementById('customDateRange');
      if (filter === 'custom') {
        if (customContainer) customContainer.classList.add('visible');
      } else {
        if (customContainer) customContainer.classList.remove('visible');
        AppState.tableCurrentPage = 1;
        updateDashboard();
      }
    });
  });

  // Custom Date Range Inputs
  const startDateInput = document.getElementById('customStartDate');
  const endDateInput = document.getElementById('customEndDate');
  const applyCustomDateBtn = document.getElementById('applyCustomDateBtn');

  if (applyCustomDateBtn && startDateInput && endDateInput) {
    applyCustomDateBtn.addEventListener('click', () => {
      if (!startDateInput.value || !endDateInput.value) {
        showToast('Please select both start and end dates', 'error');
        return;
      }
      AppState.customStartDate = startDateInput.value;
      AppState.customEndDate = endDateInput.value;
      AppState.tableCurrentPage = 1;
      updateDashboard();
      showToast('Custom date filter applied', 'success');
    });
  }

  // Action Buttons in Nav
  const btnNewSale = document.getElementById('btnNewSale');
  if (btnNewSale) {
    btnNewSale.addEventListener('click', () => openNewSaleModal());
  }

  const btnExportCsv = document.getElementById('btnExportCsv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', exportToCSV);
  }

  const btnResetData = document.getElementById('btnResetData');
  if (btnResetData) {
    btnResetData.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all data back to the default demo transactions? Any custom transactions will be cleared.')) {
        AppState.allTransactions = SalesStorage.reset();
        AppState.tableCurrentPage = 1;
        updateDashboard();
        showToast('Demo data successfully reset', 'success');
      }
    });
  }

  // Table Controls (Search, Filters, Page Size)
  const tableSearchInput = document.getElementById('tableSearchInput');
  if (tableSearchInput) {
    tableSearchInput.addEventListener('input', (e) => {
      AppState.tableSearch = e.target.value.trim().toLowerCase();
      AppState.tableCurrentPage = 1;
      renderTable();
    });
  }

  const tableCategoryFilter = document.getElementById('tableCategoryFilter');
  if (tableCategoryFilter) {
    tableCategoryFilter.addEventListener('change', (e) => {
      AppState.tableCategory = e.target.value;
      AppState.tableCurrentPage = 1;
      renderTable();
    });
  }

  const tableStatusFilter = document.getElementById('tableStatusFilter');
  if (tableStatusFilter) {
    tableStatusFilter.addEventListener('change', (e) => {
      AppState.tableStatus = e.target.value;
      AppState.tableCurrentPage = 1;
      renderTable();
    });
  }

  // Table Column Sort Headers
  const sortHeaders = document.querySelectorAll('.sales-data-table th.sortable');
  sortHeaders.forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (AppState.tableSortCol === col) {
        AppState.tableSortDir = AppState.tableSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        AppState.tableSortCol = col;
        AppState.tableSortDir = 'desc';
      }
      renderTable();
    });
  });

  // Table Pagination Buttons
  const btnPrevPage = document.getElementById('btnPrevPage');
  const btnNextPage = document.getElementById('btnNextPage');
  if (btnPrevPage) {
    btnPrevPage.addEventListener('click', () => {
      if (AppState.tableCurrentPage > 1) {
        AppState.tableCurrentPage--;
        renderTable();
      }
    });
  }
  if (btnNextPage) {
    btnNextPage.addEventListener('click', () => {
      AppState.tableCurrentPage++;
      renderTable();
    });
  }

  // Add Sale Form Submission
  const newSaleForm = document.getElementById('newSaleForm');
  if (newSaleForm) {
    newSaleForm.addEventListener('submit', handleNewSaleSubmit);
  }

  // Close Modal Buttons
  const closeButtons = document.querySelectorAll('[data-close-modal]');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllModals();
    });
  });

  // Close modals on clicking overlay backdrop
  const modalOverlays = document.querySelectorAll('.modal-overlay');
  modalOverlays.forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeAllModals();
      }
    });
  });
}

function setActiveDateFilterButton(filter) {
  document.querySelectorAll('.filter-pill-btn').forEach(btn => {
    if (btn.dataset.filter === filter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Master Dashboard Update
function updateDashboard() {
  const metrics = calculateMetricsWithTrends(
    AppState.allTransactions,
    AppState.dateFilter,
    AppState.customStartDate,
    AppState.customEndDate
  );

  // 1. Update KPI Cards
  updateKpiCards(metrics);

  // 2. Update Charts
  renderDashboardCharts(metrics.filteredTransactions, AppState.currentCurrency);

  // 3. Update Top Products
  renderTopProducts(metrics.filteredTransactions);

  // 4. Update Sales Rep Leaderboard
  renderRepLeaderboard(metrics.filteredTransactions);

  // 5. Update Transactions Table
  renderTable();

  // 6. Update Filter Summary Text
  updateFilterSummary(metrics.filteredTransactions.length);
}

// Update Top KPI Cards
function updateKpiCards(metrics) {
  const currency = AppState.currentCurrency;

  // Revenue KPI
  const kpiRevenue = document.getElementById('kpiRevenue');
  const kpiRevenueTrend = document.getElementById('kpiRevenueTrend');
  if (kpiRevenue) kpiRevenue.textContent = formatCurrency(metrics.revenue.value, currency);
  if (kpiRevenueTrend) renderTrendBadge(kpiRevenueTrend, metrics.revenue.change, '% vs prior period');

  // Orders KPI
  const kpiOrders = document.getElementById('kpiOrders');
  const kpiOrdersTrend = document.getElementById('kpiOrdersTrend');
  if (kpiOrders) kpiOrders.textContent = metrics.orders.value.toLocaleString();
  if (kpiOrdersTrend) renderTrendBadge(kpiOrdersTrend, metrics.orders.change, '% vs prior period');

  // Average Order Value KPI
  const kpiAov = document.getElementById('kpiAov');
  const kpiAovTrend = document.getElementById('kpiAovTrend');
  if (kpiAov) kpiAov.textContent = formatCurrency(metrics.aov.value, currency);
  if (kpiAovTrend) renderTrendBadge(kpiAovTrend, metrics.aov.change, '% vs prior period');

  // Conversion / Completion Rate KPI
  const kpiConv = document.getElementById('kpiConv');
  const kpiConvTrend = document.getElementById('kpiConvTrend');
  if (kpiConv) kpiConv.textContent = `${metrics.conversionRate.value.toFixed(1)}%`;
  if (kpiConvTrend) renderTrendBadge(kpiConvTrend, metrics.conversionRate.change, '% rate diff');
}

function renderTrendBadge(element, changeValue, periodLabel) {
  let badgeClass = 'neutral';
  let prefix = '';
  let arrowSvg = '';

  if (changeValue > 0) {
    badgeClass = 'positive';
    prefix = '+';
    arrowSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
  } else if (changeValue < 0) {
    badgeClass = 'negative';
    prefix = '';
    arrowSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
  } else {
    badgeClass = 'neutral';
    arrowSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
  }

  element.innerHTML = `
    <span class="trend-badge ${badgeClass}">
      ${arrowSvg} ${prefix}${changeValue}%
    </span>
    <span class="trend-period-text">${periodLabel}</span>
  `;
}

function updateFilterSummary(count) {
  const summaryEl = document.getElementById('filterSummaryText');
  if (!summaryEl) return;

  let filterLabel = 'Last 30 Days';
  if (AppState.dateFilter === 'today') filterLabel = 'Today';
  else if (AppState.dateFilter === 'last7') filterLabel = 'Last 7 Days';
  else if (AppState.dateFilter === 'quarter') filterLabel = 'Last 90 Days';
  else if (AppState.dateFilter === 'all') filterLabel = 'All Time';
  else if (AppState.dateFilter === 'custom') {
    filterLabel = `${AppState.customStartDate || 'Start'} to ${AppState.customEndDate || 'End'}`;
  }

  summaryEl.innerHTML = `Showing <strong>${count}</strong> transactions for <strong>${filterLabel}</strong>`;
}

// Render Top Products List
function renderTopProducts(transactions) {
  const container = document.getElementById('topProductsList');
  if (!container) return;

  const productAgg = {};
  transactions
    .filter(t => t.status === 'Completed')
    .forEach(t => {
      if (!productAgg[t.product]) {
        productAgg[t.product] = {
          name: t.product,
          category: t.category,
          revenue: 0,
          units: 0
        };
      }
      productAgg[t.product].revenue += t.amount;
      productAgg[t.product].units += (t.quantity || 1);
    });

  const sortedProducts = Object.values(productAgg).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  if (sortedProducts.length === 0) {
    container.innerHTML = `<div style="color: #64748b; font-size: 13px; padding: 12px 0;">No completed sales in this period.</div>`;
    return;
  }

  let html = '';
  sortedProducts.forEach((prod, index) => {
    const rankClass = index === 0 ? 'rank-1' : (index === 1 ? 'rank-2' : (index === 2 ? 'rank-3' : ''));
    html += `
      <div class="top-list-item">
        <div class="top-list-left">
          <div class="rank-badge ${rankClass}">#${index + 1}</div>
          <div class="item-info">
            <span class="item-name">${escapeHtml(prod.name)}</span>
            <span class="item-subtext">${escapeHtml(prod.category)} • ${prod.units} units sold</span>
          </div>
        </div>
        <div class="top-list-right">
          <span class="item-metric-val">${formatCurrency(prod.revenue, AppState.currentCurrency)}</span>
          <span class="item-metric-sub">Gross Sales</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Render Sales Rep Leaderboard
function renderRepLeaderboard(transactions) {
  const container = document.getElementById('repLeaderboardList');
  if (!container) return;

  const repAgg = {};
  REPS.forEach(r => {
    repAgg[r.name] = { name: r.name, quota: r.quota, revenue: 0, count: 0 };
  });

  transactions
    .filter(t => t.status === 'Completed')
    .forEach(t => {
      if (repAgg[t.salesRep]) {
        repAgg[t.salesRep].revenue += t.amount;
        repAgg[t.salesRep].count += 1;
      }
    });

  const sortedReps = Object.values(repAgg).sort((a, b) => b.revenue - a.revenue);

  let html = '';
  sortedReps.forEach((rep, index) => {
    const quotaPct = Math.round((rep.revenue / rep.quota) * 100);
    const rankClass = index === 0 ? 'rank-1' : (index === 1 ? 'rank-2' : (index === 2 ? 'rank-3' : ''));
    html += `
      <div class="top-list-item">
        <div class="top-list-left">
          <div class="rank-badge ${rankClass}">#${index + 1}</div>
          <div class="item-info">
            <span class="item-name">${escapeHtml(rep.name)}</span>
            <span class="item-subtext">${quotaPct}% of ${formatCurrency(rep.quota, AppState.currentCurrency)} quota • ${rep.count} deals</span>
          </div>
        </div>
        <div class="top-list-right">
          <span class="item-metric-val">${formatCurrency(rep.revenue, AppState.currentCurrency)}</span>
          <span class="item-metric-sub">${quotaPct >= 100 ? 'Quota Met' : 'In Progress'}</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Render Real-Time Sales Table
function renderTable() {
  const tableBody = document.getElementById('salesTableBody');
  const paginationInfo = document.getElementById('tablePaginationInfo');
  const btnPrev = document.getElementById('btnPrevPage');
  const btnNext = document.getElementById('btnNextPage');
  if (!tableBody) return;

  // 1. Date Filter
  let filtered = filterTransactions(
    AppState.allTransactions,
    AppState.dateFilter,
    AppState.customStartDate,
    AppState.customEndDate
  );

  // 2. Category Filter
  if (AppState.tableCategory !== 'all') {
    filtered = filtered.filter(t => t.category === AppState.tableCategory);
  }

  // 3. Status Filter
  if (AppState.tableStatus !== 'all') {
    filtered = filtered.filter(t => t.status === AppState.tableStatus);
  }

  // 4. Search Filter
  if (AppState.tableSearch) {
    const q = AppState.tableSearch;
    filtered = filtered.filter(t =>
      t.id.toLowerCase().includes(q) ||
      t.customerName.toLowerCase().includes(q) ||
      t.customerEmail.toLowerCase().includes(q) ||
      t.product.toLowerCase().includes(q) ||
      (t.salesRep && t.salesRep.toLowerCase().includes(q))
    );
  }

  // 5. Sort
  filtered.sort((a, b) => {
    let aVal = a[AppState.tableSortCol];
    let bVal = b[AppState.tableSortCol];

    if (AppState.tableSortCol === 'date') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (AppState.tableSortDir === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const totalRows = filtered.length;
  const totalPages = Math.ceil(totalRows / AppState.tablePageSize) || 1;

  if (AppState.tableCurrentPage > totalPages) {
    AppState.tableCurrentPage = totalPages;
  }
  if (AppState.tableCurrentPage < 1) {
    AppState.tableCurrentPage = 1;
  }

  const startIdx = (AppState.tableCurrentPage - 1) * AppState.tablePageSize;
  const pageRows = filtered.slice(startIdx, startIdx + AppState.tablePageSize);

  // Render Table Rows
  if (pageRows.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="table-empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div class="empty-state-title">No transactions found</div>
            <div class="empty-state-desc">Try clearing your search query or adjusting your filters.</div>
          </div>
        </td>
      </tr>
    `;
  } else {
    let rowsHtml = '';
    pageRows.forEach(txn => {
      const dateObj = new Date(txn.date);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const formattedTime = dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const statusLower = (txn.status || 'Completed').toLowerCase();

      rowsHtml += `
        <tr>
          <td>
            <span style="font-family: monospace; font-size: 12px; color: #818cf8; font-weight: 600;">
              ${escapeHtml(txn.id)}
            </span>
          </td>
          <td>
            <div class="customer-cell">
              <span class="customer-name">${escapeHtml(txn.customerName)}</span>
              <span class="customer-email">${escapeHtml(txn.customerEmail)}</span>
            </div>
          </td>
          <td>
            <div style="font-weight: 500; color: #f1f5f9;">${escapeHtml(txn.product)}</div>
            <div style="font-size: 11px; color: #64748b;">${escapeHtml(txn.category)}</div>
          </td>
          <td>
            <span class="badge-channel">${escapeHtml(txn.channel || 'Direct')}</span>
          </td>
          <td class="amount-cell">
            ${formatCurrency(txn.amount, AppState.currentCurrency)}
          </td>
          <td>
            <span class="badge-status ${statusLower}">
              ${escapeHtml(txn.status)}
            </span>
          </td>
          <td>
            <div style="font-size: 12px; color: #cbd5e1;">${formattedDate}</div>
            <div style="font-size: 11px; color: #64748b;">${formattedTime}</div>
          </td>
          <td>
            <div class="action-btn-group">
              <button class="table-action-icon-btn" title="View Details" onclick="viewTransactionDetails('${txn.id}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
              <button class="table-action-icon-btn delete-btn" title="Delete Sale" onclick="deleteTransactionRow('${txn.id}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    tableBody.innerHTML = rowsHtml;
  }

  // Update Pagination Controls
  if (paginationInfo) {
    const endIdx = Math.min(startIdx + AppState.tablePageSize, totalRows);
    paginationInfo.textContent = totalRows > 0
      ? `Showing ${startIdx + 1}-${endIdx} of ${totalRows} entries (Page ${AppState.tableCurrentPage} of ${totalPages})`
      : 'No records to display';
  }

  if (btnPrev) btnPrev.disabled = AppState.tableCurrentPage <= 1;
  if (btnNext) btnNext.disabled = AppState.tableCurrentPage >= totalPages;
}

// Modal Controllers
function openNewSaleModal() {
  const modal = document.getElementById('newSaleModal');
  const form = document.getElementById('newSaleForm');
  if (form) form.reset();

  // Set default date to now
  const dateInput = document.getElementById('saleDate');
  if (dateInput) {
    const nowIso = new Date().toISOString().slice(0, 16);
    dateInput.value = nowIso;
  }

  if (modal) modal.classList.add('active');
}

function handleNewSaleSubmit(e) {
  e.preventDefault();

  const customerName = document.getElementById('saleCustomerName').value.trim();
  const customerEmail = document.getElementById('saleCustomerEmail').value.trim();
  const product = document.getElementById('saleProduct').value.trim();
  const category = document.getElementById('saleCategory').value;
  const channel = document.getElementById('saleChannel').value;
  const region = document.getElementById('saleRegion').value;
  const amountVal = parseFloat(document.getElementById('saleAmount').value);
  const quantityVal = parseInt(document.getElementById('saleQuantity').value, 10) || 1;
  const status = document.getElementById('saleStatus').value;
  const dateVal = document.getElementById('saleDate').value;
  const salesRep = document.getElementById('saleRep').value;

  if (!customerName || !product || isNaN(amountVal) || amountVal <= 0) {
    showToast('Please fill in all required fields with valid values.', 'error');
    return;
  }

  // If currency is not USD, convert back to base USD for storage
  const config = CURRENCY_CONFIG[AppState.currentCurrency] || CURRENCY_CONFIG.USD;
  const baseUsdAmount = Math.round(amountVal / config.rate);

  const newTxn = {
    id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
    customerName: customerName,
    customerEmail: customerEmail || `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    product: product,
    category: category,
    channel: channel,
    region: region,
    salesRep: salesRep,
    quantity: quantityVal,
    amount: baseUsdAmount,
    status: status,
    date: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString()
  };

  AppState.allTransactions = SalesStorage.add(newTxn);
  closeAllModals();
  updateDashboard();
  showToast(`Transaction ${newTxn.id} recorded and saved to LocalStorage!`, 'success');
}

// View Transaction Details / Receipt
window.viewTransactionDetails = function(txnId) {
  const txn = AppState.allTransactions.find(t => t.id === txnId);
  if (!txn) return;

  AppState.selectedTransaction = txn;
  const detailsBody = document.getElementById('receiptModalContent');
  const modal = document.getElementById('receiptModal');
  if (!detailsBody || !modal) return;

  const dateObj = new Date(txn.date);
  const statusLower = txn.status.toLowerCase();

  detailsBody.innerHTML = `
    <div class="receipt-card">
      <div class="receipt-row">
        <span class="receipt-label">Transaction ID</span>
        <span class="receipt-val" style="font-family: monospace; color: #818cf8;">${escapeHtml(txn.id)}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Timestamp</span>
        <span class="receipt-val">${dateObj.toLocaleString()}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Payment Status</span>
        <span class="badge-status ${statusLower}">${escapeHtml(txn.status)}</span>
      </div>

      <div class="receipt-divider"></div>

      <div class="receipt-row">
        <span class="receipt-label">Customer Name</span>
        <span class="receipt-val">${escapeHtml(txn.customerName)}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Customer Email</span>
        <span class="receipt-val" style="color: #94a3b8;">${escapeHtml(txn.customerEmail)}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Sales Representative</span>
        <span class="receipt-val">${escapeHtml(txn.salesRep || 'Direct')}</span>
      </div>

      <div class="receipt-divider"></div>

      <div class="receipt-row">
        <span class="receipt-label">Item / Service</span>
        <span class="receipt-val">${escapeHtml(txn.product)}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Category</span>
        <span class="receipt-val">${escapeHtml(txn.category)}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Acquisition Channel</span>
        <span class="receipt-val">${escapeHtml(txn.channel)}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Region</span>
        <span class="receipt-val">${escapeHtml(txn.region)}</span>
      </div>
      <div class="receipt-row">
        <span class="receipt-label">Quantity</span>
        <span class="receipt-val">${txn.quantity || 1}</span>
      </div>

      <div class="receipt-divider"></div>

      <div class="receipt-row" style="font-size: 16px;">
        <span style="font-weight: 700; color: #ffffff;">Total Billed</span>
        <span style="font-weight: 800; color: #10b981;">${formatCurrency(txn.amount, AppState.currentCurrency)}</span>
      </div>
    </div>
  `;

  // Update status toggle buttons inside receipt modal
  const btnToggleStatus = document.getElementById('btnToggleRefundStatus');
  if (btnToggleStatus) {
    if (txn.status === 'Refunded') {
      btnToggleStatus.textContent = 'Mark as Completed';
    } else {
      btnToggleStatus.textContent = 'Mark as Refunded';
    }
    btnToggleStatus.onclick = () => toggleTransactionStatus(txn.id);
  }

  modal.classList.add('active');
};

function toggleTransactionStatus(txnId) {
  const txn = AppState.allTransactions.find(t => t.id === txnId);
  if (!txn) return;

  const newStatus = txn.status === 'Refunded' ? 'Completed' : 'Refunded';
  AppState.allTransactions = SalesStorage.update(txnId, { status: newStatus });
  closeAllModals();
  updateDashboard();
  showToast(`Transaction ${txnId} updated to ${newStatus}`, 'info');
}

// Delete Row Action
window.deleteTransactionRow = function(txnId) {
  if (confirm(`Are you sure you want to delete transaction ${txnId}? This action cannot be undone.`)) {
    AppState.allTransactions = SalesStorage.delete(txnId);
    updateDashboard();
    showToast(`Transaction ${txnId} removed from LocalStorage`, 'info');
  }
};

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

// Export to CSV
function exportToCSV() {
  const filtered = filterTransactions(
    AppState.allTransactions,
    AppState.dateFilter,
    AppState.customStartDate,
    AppState.customEndDate
  );

  if (filtered.length === 0) {
    showToast('No transactions to export for the selected period', 'error');
    return;
  }

  const headers = ['Transaction ID', 'Customer Name', 'Customer Email', 'Product', 'Category', 'Channel', 'Region', 'Sales Rep', 'Quantity', 'Amount (USD)', 'Status', 'Date'];
  
  const csvRows = [headers.join(',')];

  filtered.forEach(t => {
    const row = [
      `"${t.id}"`,
      `"${t.customerName.replace(/"/g, '""')}"`,
      `"${t.customerEmail.replace(/"/g, '""')}"`,
      `"${t.product.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      `"${t.channel}"`,
      `"${t.region}"`,
      `"${t.salesRep || ''}"`,
      t.quantity || 1,
      t.amount,
      `"${t.status}"`,
      `"${t.date}"`
    ];
    csvRows.push(row.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sales_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Exported ${filtered.length} transactions to CSV`, 'success');
}

// Toast Notifications System
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `${iconSvg} <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Utility: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
