Store.requireAuth('admin');

lucide.createIcons();

/* ===========================================================
 *  DATA MAPPING HELPERS
 *  Normalise Supabase fields → UI-friendly values
 * =========================================================*/

/**
 * Derive a mock fraud score from claim status.
 * Live DB claims don't carry a fraudScore field, so we infer one.
 */
function deriveFraudScore(status) {
    switch (status) {
        case 'Auto-Rejected': return 0.92;
        case 'Rejected':      return 0.85;
        case 'In Review':     return 0.55;
        case 'Auto-Approved': return 0.12;
        case 'Paid':          return 0.08;
        default:              return 0.50;
    }
}

/**
 * Map claim status to a Tailwind color token.
 * Returns an object with inline-safe hex values (for Tailwind CDN compatibility).
 */
function deriveStatusStyle(status) {
    switch (status) {
        case 'Paid':
        case 'Auto-Approved':
            return { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  label: status };
        case 'In Review':
            return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'In Review' };
        case 'Auto-Rejected':
        case 'Rejected':
            return { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',  label: status };
        default:
            return { color: '#64748b', bg: 'rgba(100,116,139,0.1)', label: status || 'Unknown' };
    }
}

/**
 * Build the Action column HTML for a claim row.
 */
function buildActionCell(claim) {
    const id = claim.id || claim.rider || claim.rider_email || '';
    if (claim.status === 'In Review') {
        return `
            <div class="flex space-x-2">
                <button onclick="handleClaimAction('${id}', 'Paid')"
                    class="px-3 py-1 bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-white rounded text-xs font-bold transition-all">Approve</button>
                <button onclick="handleClaimAction('${id}', 'Rejected')"
                    class="px-3 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded text-xs font-bold transition-all">Reject</button>
            </div>`;
    }
    if (claim.status === 'Paid' || claim.status === 'Auto-Approved') {
        return `<span class="text-gray-500 font-bold text-xs flex items-center"><i data-lucide="check-circle" class="w-3 h-3 mr-1 text-emerald-500"></i> Done</span>`;
    }
    if (claim.status === 'Rejected' || claim.status === 'Auto-Rejected') {
        return `<span class="text-rose-500 font-bold text-xs flex items-center"><i data-lucide="x-circle" class="w-3 h-3 mr-1"></i> Rejected</span>`;
    }
    return `<span class="text-gray-600 text-xs">${claim.action || '—'}</span>`;
}

/* ===========================================================
 *  NOTIFICATION SYSTEM
 * =========================================================*/
window.updateNotifications = async function () {
    const allClaims = await Store.getClaims();
    const pendingClaims = allClaims.filter(c => c.status === 'In Review');
    const inReviewCount = pendingClaims.length;

    const notifToggle = document.getElementById('notification-toggle');
    if (notifToggle) {
        const badge = notifToggle.querySelector('span');
        if (badge) badge.innerText = inReviewCount;
    }

    const notifsContainer = document.getElementById('notifications-list');
    if (notifsContainer) {
        if (inReviewCount === 0) {
            notifsContainer.innerHTML = `<div class="p-8 text-center text-gray-500 text-sm">No pending claims to review.</div>`;
        } else {
            notifsContainer.innerHTML = pendingClaims.map(c => {
                const rider = c.rider || c.rider_email || 'Unknown';
                const zone  = c.zone || 'N/A';
                const event = c.event || c.event_type || 'N/A';
                const id    = c.id || rider;
                return `
                    <div class="p-4 border-b border-slate-800/50 hover:bg-slate-800/20 transition-all">
                        <p class="text-[11px] text-amber-500 font-bold uppercase mb-1">Pending Claim</p>
                        <p class="text-xs text-white">${rider} - ${zone}</p>
                        <p class="text-xs text-gray-400 mb-2">${event} - <span class="text-white font-bold">${c.amount}</span></p>
                        <div class="flex space-x-2 mt-2">
                            <button onclick="handleQuickAction('${id}', 'Paid')" class="px-3 py-1.5 flex-1 bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-white rounded text-xs font-bold transition-all">Approve</button>
                            <button onclick="handleQuickAction('${id}', 'Rejected')" class="px-3 py-1.5 flex-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded text-xs font-bold transition-all">Reject</button>
                        </div>
                    </div>`;
            }).join('');
        }
    }
};

window.handleQuickAction = async function (id, newStatus) {
    await Store.updateClaimStatus(id, newStatus);
    if (typeof window.updateNotifications === 'function') await window.updateNotifications();
    if (typeof window.renderActiveClaims === 'function') await window.renderActiveClaims();
    window.dispatchEvent(new Event('storage'));
};

/* ===========================================================
 *  ACTIVE CLAIMS TABLE — with normalised field mapping
 * =========================================================*/
window.renderActiveClaims = async function () {
    const allClaims = await Store.getClaims();
    const tbody = document.getElementById('active-claims-tbody');
    if (!tbody) return;

    if (allClaims.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="7" class="text-center text-gray-500 py-10">
                <div class="flex flex-col items-center">
                    <i data-lucide="folder-open" class="w-8 h-8 mb-2 opacity-30 text-teal-500"></i>
                    <span>No active claims found.</span>
                </div>
            </td></tr>`;
        lucide.createIcons();
        return;
    }

    tbody.innerHTML = allClaims.map(c => {
        // ---- Normalise fields (works for both mock & Supabase data) ----
        const rider      = c.rider || c.rider_email || 'Unknown';
        const zone       = c.zone || 'N/A';
        const event      = c.event || c.event_type || 'N/A';
        const amount     = c.amount || '₹0';
        const status     = c.status || 'Unknown';
        const fraudScore = c.fraudScore ?? deriveFraudScore(status);
        const style      = deriveStatusStyle(status);

        // Fraud score color (amber if ≥ 0.5, otherwise default)
        const scoreColor = fraudScore >= 0.5 ? '#f59e0b' : '#94a3b8';

        return `
            <tr class="hover:bg-slate-800/20 transition-colors">
                <td class="font-bold text-sm">${rider}</td>
                <td class="text-sm text-gray-400">${zone}</td>
                <td class="text-sm">${event}</td>
                <td class="font-bold">${amount}</td>
                <td class="text-sm font-bold" style="color:${scoreColor}">${fraudScore.toFixed(2)}</td>
                <td>
                    <span class="status-pill" style="background:${style.bg};color:${style.color}">
                        ${style.label}
                    </span>
                </td>
                <td class="text-xs">${buildActionCell(c)}</td>
            </tr>`;
    }).join('');

    lucide.createIcons();
};

window.handleClaimAction = async function (id, newStatus) {
    await Store.updateClaimStatus(id, newStatus);
    await renderActiveClaims();
    await updateNotifications();
};

/* ===========================================================
 *  PAYOUT HISTORY TABLE — with normalised field mapping
 * =========================================================*/
window.renderPayoutHistory = async function () {
    const allClaims = await Store.getClaims();
    const paidClaims = allClaims.filter(c => c.status === 'Paid' || c.status === 'Auto-Approved');
    const tbody = document.getElementById('payout-history-tbody');
    if (!tbody) return;

    if (paidClaims.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" class="text-center text-gray-500 py-10">
                <div class="flex flex-col items-center">
                    <i data-lucide="folders" class="w-8 h-8 mb-2 opacity-30 text-teal-500"></i>
                    <span>No payout history available.</span>
                </div>
            </td></tr>`;
        lucide.createIcons();
        return;
    }

    tbody.innerHTML = paidClaims.map(p => {
        const rider  = p.rider || p.rider_email || 'Unknown';
        const amount = p.amount || '₹0';
        const zone   = p.zone || 'N/A';
        const event  = p.event || p.event_type || 'N/A';
        const time   = p.time || p.created_at || 'Just now';
        const upiRef = p.upiRef || p.upi_ref || `TRX${Math.floor(Math.random() * 90000) + 10000}`;

        return `
            <tr class="hover:bg-slate-800/30 transition-colors">
                <td class="font-bold">${rider}</td>
                <td class="text-teal-400 font-bold">${amount}</td>
                <td class="text-gray-400">${zone}</td>
                <td>${event}</td>
                <td class="text-gray-500">${time}</td>
                <td class="text-[10px] text-gray-600 font-mono">${upiRef}</td>
            </tr>`;
    }).join('');
};

/* ===========================================================
 *  DOM CONTENT LOADED — INIT (single consolidated listener)
 * =========================================================*/
document.addEventListener('DOMContentLoaded', async () => {
    await updateNotifications();
    await renderActiveClaims();

    // ---- Payout History Stats ----
    const allClaims = await Store.getClaims();
    const paidClaims = allClaims.filter(c => c.status === 'Paid' || c.status === 'Auto-Approved');
    let sum = 0;
    paidClaims.forEach(c => sum += parseInt(String(c.amount).replace(/[^0-9]/g, '')) || 0);
    const avg = paidClaims.length ? sum / paidClaims.length : 0;
    
    const paidEl = document.getElementById('stat-total-paid');
    const avgEl = document.getElementById('stat-avg-payout');
    const fastEl = document.getElementById('stat-fastest-payout');

    if (paidEl) paidEl.innerText = '₹' + sum.toLocaleString('en-IN');
    if (avgEl) avgEl.innerText = '₹' + Math.round(avg).toLocaleString('en-IN');
    if (fastEl) fastEl.innerText = paidClaims.length ? '1 min' : '0 min';

    // ---- Payout History Table ----
    await renderPayoutHistory();

    // ---- Subscription Status Cards ----
    const subsContainer = document.getElementById('subscription-cards-container');
    if (subsContainer) {
        const allRiders = await Store.getRiders();
        const activeRiders = allRiders.filter(r => r.onboarded);
        const pendingRiders = allRiders.filter(r => !r.onboarded);

        subsContainer.innerHTML = `
            <div class="card p-6">
                <div class="flex items-center space-x-3 mb-4">
                    <div class="p-2 bg-emerald-500/10 rounded-lg"><i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i></div>
                    <h4 class="text-sm font-bold">Active Subscriptions</h4>
                </div>
                <p class="text-3xl font-bold text-emerald-400">${activeRiders.length}</p>
                <p class="text-[10px] text-gray-500 font-bold uppercase mt-2">Riders with active coverage</p>
            </div>
            <div class="card p-6">
                <div class="flex items-center space-x-3 mb-4">
                    <div class="p-2 bg-amber-500/10 rounded-lg"><i data-lucide="clock" class="w-4 h-4 text-amber-400"></i></div>
                    <h4 class="text-sm font-bold">Pending Onboarding</h4>
                </div>
                <p class="text-3xl font-bold text-amber-400">${pendingRiders.length}</p>
                <p class="text-[10px] text-gray-500 font-bold uppercase mt-2">Registered but not onboarded</p>
            </div>
        `;
    }

    lucide.createIcons();
});

/* ===========================================================
 *  LOCATION API (GPS → IP fallback)
 * =========================================================*/
async function fetchLocation() {
    const locSpan = document.getElementById('user-location');
    if (!locSpan) return;
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
                const data = await res.json();
                locSpan.innerText = data.address.city || data.address.town || "Delhi NCR";
            } catch (e) {
                fallbackIP();
            }
        }, () => fallbackIP());
    } else {
        fallbackIP();
    }
}

async function fallbackIP() {
    const locSpan = document.getElementById('user-location');
    if (!locSpan) return;
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        locSpan.innerText = `${data.city}, ${data.region_code}`;
    } catch (e) {
        locSpan.innerText = 'Delhi NCR';
    }
}
fetchLocation();

/* ===========================================================
 *  DROPDOWN TOGGLES
 * =========================================================*/
function setupDropdown(btnId, menuId) {
    const btn = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    if (!btn || !menu) return;
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('[id$="-menu"]').forEach(m => m !== menu && m.classList.add('hidden'));
        menu.classList.toggle('hidden');
    });
}
setupDropdown('notification-toggle', 'notification-menu');
setupDropdown('profile-toggle', 'profile-menu');
document.addEventListener('click', () => document.querySelectorAll('[id$="-menu"]').forEach(m => m.classList.add('hidden')));

/* ===========================================================
 *  TAB SWITCHING & CHART
 * =========================================================*/
let historyChart = null;

window.switchTab = function(view) {
    const activeView  = document.getElementById('active-view');
    const historyView = document.getElementById('history-view');
    const btnActive   = document.getElementById('btn-active');
    const btnHistory  = document.getElementById('btn-history');

    if (view === 'history') {
        if (activeView) activeView.classList.add('hidden');
        if (historyView) historyView.classList.remove('hidden');
        if (btnHistory) btnHistory.classList.add('active');
        if (btnActive) btnActive.classList.remove('active');

        // Initialize Chart.js Bar Chart (once)
        const chartCanvas = document.getElementById('payoutBarChart');
        if (chartCanvas && !historyChart) {
            const ctx = chartCanvas.getContext('2d');
            
            // Generate visually pleasing mock distribution proportional to total paid
            const paidEl = document.getElementById('stat-total-paid');
            const sumStr = paidEl ? paidEl.innerText.replace(/[^0-9]/g, '') : '0';
            const sum = parseInt(sumStr) || 0;
            
            let chartData = [0, 0, 0, 0, 0, 0, 0];
            if (sum > 0) {
                const pFactors = [0.05, 0.20, 0.10, 0.15, 0.10, 0.30, 0.10];
                chartData = pFactors.map(f => Math.round(sum * f));
            }

            historyChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        data: chartData,
                        backgroundColor: '#14b8a6',
                        borderRadius: 6,
                        barThickness: 50
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            grid: { color: '#1e293b' },
                            ticks: { color: '#64748b', callback: v => '₹' + v.toLocaleString('en-IN') }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#64748b' }
                        }
                    }
                }
            });
        }
    } else {
        if (historyView) historyView.classList.add('hidden');
        if (activeView) activeView.classList.remove('hidden');
        if (btnActive) btnActive.classList.add('active');
        if (btnHistory) btnHistory.classList.remove('active');
    }
};

/* ===========================================================
 *  SIGN OUT + CROSS-TAB SYNC
 * =========================================================*/
const sidebarSignout = document.getElementById('sidebar-signout');
const profileLogout = document.getElementById('logout-btn');
if (sidebarSignout) sidebarSignout.addEventListener('click', () => Store.logout());
if (profileLogout) profileLogout.addEventListener('click', () => Store.logout());

window.addEventListener('storage', (e) => {
    if (e.key === 'gigshield_claims') {
        if (typeof window.updateNotifications === 'function') window.updateNotifications();
        if (typeof window.renderActiveClaims === 'function') window.renderActiveClaims();
        if (typeof window.renderPayoutHistory === 'function') window.renderPayoutHistory();
    }
});
