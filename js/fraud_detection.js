Store.requireAuth('admin');

lucide.createIcons();

/* ===========================================================
 *  INITIALIZATION
 * =========================================================*/
document.addEventListener('DOMContentLoaded', async () => {

    // ---- Populate notifications ----
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
                notifsContainer.innerHTML = pendingClaims.map(c => `
                    <div class="p-4 border-b border-slate-800/50 hover:bg-slate-800/20 transition-all">
                        <p class="text-[11px] text-amber-500 font-bold uppercase mb-1">Pending Claim</p>
                        <p class="text-xs text-white">${c.rider || c.rider_email || 'Unknown'} - ${c.zone || 'N/A'}</p>
                        <p class="text-xs text-gray-400 mb-2">${c.event || c.event_type || 'N/A'} - <span class="text-white font-bold">${c.amount}</span></p>
                        <div class="flex space-x-2 mt-2">
                            <button onclick="handleQuickAction('${c.id || c.rider}', 'Paid')" class="px-3 py-1.5 flex-1 bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-white rounded text-xs font-bold transition-all">Approve</button>
                            <button onclick="handleQuickAction('${c.id || c.rider}', 'Rejected')" class="px-3 py-1.5 flex-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded text-xs font-bold transition-all">Reject</button>
                        </div>
                    </div>
                `).join('');
            }
        }
    };

    window.handleQuickAction = async function (id, newStatus) {
        await Store.updateClaimStatus(id, newStatus);
        if (typeof window.updateNotifications === 'function') await window.updateNotifications();
        window.dispatchEvent(new Event('storage'));
    };

    await updateNotifications();

    // ---- Populate Incoming Claim ----
    const allClaimsForFraud = await Store.getClaims();
    const inReviewClaim = allClaimsForFraud.find(c => c.status === 'In Review') || null;
    const riderEl = document.getElementById('claim-rider');
    const zoneEl = document.getElementById('claim-zone');
    const amountEl = document.getElementById('claim-amount');
    const eventEl = document.getElementById('claim-event');

    if (inReviewClaim) {
        if (riderEl) riderEl.innerText = inReviewClaim.rider || inReviewClaim.rider_email || 'Unknown';
        if (zoneEl) zoneEl.innerText = inReviewClaim.zone || 'N/A';
        if (amountEl) amountEl.innerText = inReviewClaim.amount || '₹0';
        if (eventEl) eventEl.innerText = inReviewClaim.event || inReviewClaim.event_type || 'N/A';
    } else {
        if (riderEl) riderEl.innerText = 'No Pending Claim';
        if (zoneEl) zoneEl.innerText = '—';
        if (amountEl) amountEl.innerText = '—';
        if (eventEl) eventEl.innerText = '—';
    }

    // ---- Populate Ring Detection ----
    const ringTitle = document.getElementById('ring-title');
    if (ringTitle) ringTitle.innerText = "Coordinate Ring Status";
    const bulletsContainer = document.getElementById('ring-bullets');
    if (bulletsContainer) bulletsContainer.innerHTML = '';

    // ---- Populate Intel Table ----
    const thead = document.getElementById('intel-thead');
    if (thead) thead.innerHTML = `<tr><th>Signal</th><th>Honest</th><th>Fraud</th></tr>`;

    const tbody = document.getElementById('intel-tbody');
    if (tbody) tbody.innerHTML = '';

    lucide.createIcons();
});

/* ===========================================================
 *  LOCATION API
 * =========================================================*/
async function fetchLocation() {
    const locSpan = document.getElementById('user-location');
    if (!locSpan) return;
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        locSpan.innerText = `${data.city}, ${data.region_code}`;
    } catch (error) {
        locSpan.innerText = "Delhi NCR";
    }
}
fetchLocation();

/* ===========================================================
 *  TOGGLE DROPDOWNS
 * =========================================================*/
function setupMenu(btnId, menuId) {
    const btn = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    if (!btn || !menu) return;
    btn.onclick = (e) => {
        e.stopPropagation();
        document.querySelectorAll('[id$="-menu"]').forEach(m => m !== menu && m.classList.add('hidden'));
        menu.classList.toggle('hidden');
    };
}
setupMenu('notification-toggle', 'notification-menu');
setupMenu('profile-toggle', 'profile-menu');
document.onclick = () => document.querySelectorAll('[id$="-menu"]').forEach(m => m.classList.add('hidden'));

/* ===========================================================
 *  RUN FRAUD CHECK — SEQUENTIAL REVEAL
 * =========================================================*/
let checkRunning = false;
let animationInterval;

// Color maps for inline styles (Tailwind CDN can't handle dynamic class interpolation)
const statusColorMap = {
    emerald: { text: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    rose:    { text: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
    amber:   { text: '#f59e0b', bg: 'rgba(245,158,11,0.1)' }
};

const borderColorMap = {
    emerald: 'rgba(16,185,129,0.3)',
    rose:    'rgba(244,63,94,0.3)',
    amber:   'rgba(245,158,11,0.3)'
};

const impactColorMap = {
    emerald: '#10b981',
    rose:    '#f43f5e',
    amber:   '#f59e0b'
};

window.runCheck = function() {
    if (checkRunning) return;
    checkRunning = true;

    // Disable button visually
    const btn = document.getElementById('run-check-btn');
    if (btn) {
        btn.innerHTML = `<div style="width:16px;height:16px;border:2px solid rgba(20,184,166,0.3);border-top-color:#14b8a6;border-radius:50%;animation:spin 0.8s linear infinite" class="mr-2"></div> Analyzing...`;
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.6';
    }

    // 1. Clear checks container and hide result
    const container = document.getElementById('checks-container');
    if (container) container.innerHTML = '';

    const resultSection = document.getElementById('resultSection');
    if (resultSection) resultSection.classList.add('hidden');

    const rejectBanner = document.getElementById('reject-banner');
    if (rejectBanner) rejectBanner.classList.add('hidden');

    // Reset score ring
    const circle = document.getElementById('scoreCircle');
    const scoreText = document.getElementById('scoreText');
    const circumference = 282.7;
    if (circle) circle.style.strokeDashoffset = circumference;
    if (scoreText) scoreText.innerText = '0';

    // 2. Sequential reveal — one check every 600ms
    const checks = [
        { label: 'GPS Location Verification',   icon: 'map-pin',       status: 'pass',  impact: 'Low',    color: 'emerald', detail: 'Rider GPS matches zone coordinates within 500m radius' },
        { label: 'Weather Cross-Reference',      icon: 'cloud-rain',    status: 'fail',  impact: 'High',   color: 'rose',    detail: 'No severe weather recorded in zone at claim time' },
        { label: 'Behavioral Pattern Analysis',  icon: 'activity',      status: 'fail',  impact: 'High',   color: 'rose',    detail: '3 claims in 48 hours from single rider — exceeds threshold' },
        { label: 'Zone Risk Correlation',        icon: 'shield',        status: 'warn',  impact: 'Medium', color: 'amber',   detail: 'Zone has moderate historical claim frequency' },
        { label: 'Claim Timing Analysis',        icon: 'clock',         status: 'fail',  impact: 'High',   color: 'rose',    detail: 'Claim submitted outside active delivery window (2:00 AM)' }
    ];
    const staggerDelay = 600; // ms between each check

    checks.forEach((check, idx) => {
        setTimeout(() => {
            if (!container) return;
            const statusIcon = check.status === 'pass' ? 'check-circle' : check.status === 'fail' ? 'x-circle' : 'alert-triangle';
            const sc = statusColorMap[check.color] || statusColorMap.amber;
            const bc = borderColorMap[check.color] || borderColorMap.amber;
            const ic = impactColorMap[check.color] || impactColorMap.amber;

            const card = document.createElement('div');
            card.className = 'card p-5 flex items-start space-x-4 result-reveal';
            card.style.cssText = `border: 1px solid ${bc}`;
            card.innerHTML = `
                <div class="p-2 rounded-lg shrink-0" style="background:${sc.bg}">
                    <i data-lucide="${check.icon}" class="w-4 h-4" style="color:${sc.text}"></i>
                </div>
                <div class="flex-1">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-sm font-bold">${check.label}</span>
                        <span class="flex items-center text-[10px] font-bold uppercase" style="color:${sc.text}">
                            <i data-lucide="${statusIcon}" class="w-3 h-3 mr-1"></i>
                            ${check.status === 'pass' ? 'Passed' : check.status === 'fail' ? 'Failed' : 'Warning'}
                        </span>
                    </div>
                    <p class="text-[11px] text-gray-500">${check.detail}</p>
                    <p class="text-[10px] mt-1 font-bold" style="color:${ic}">Impact: ${check.impact}</p>
                </div>
            `;
            container.appendChild(card);
            lucide.createIcons();
        }, idx * staggerDelay);
    });

    // 3. After all checks revealed — show result section + animate score ring
    const totalCheckTime = checks.length * staggerDelay;

    setTimeout(() => {
        // Reveal result section
        if (resultSection) {
            resultSection.classList.remove('hidden');
            const resCard = resultSection.querySelector('.card');
            if (resCard) resCard.classList.add('result-reveal');
        }

        // Show scan line
        const scanEl = document.getElementById('scan-line-el');
        if (scanEl) {
            scanEl.classList.remove('hidden');
            setTimeout(() => scanEl.classList.add('hidden'), 1500);
        }

        // Animate score ring — target 78/100 (high fraud probability)
        const targetScore = 78;
        let score = 0;

        clearInterval(animationInterval);
        animationInterval = setInterval(() => {
            if (score >= targetScore) {
                clearInterval(animationInterval);

                // Show reject banner after score hits target
                const resScoreSpan = document.getElementById('resultScoreSpan');
                if (resScoreSpan) resScoreSpan.innerText = targetScore;
                if (rejectBanner) {
                    rejectBanner.classList.remove('hidden');
                    const rejectDiv = rejectBanner.querySelector('div');
                    if (rejectDiv) rejectDiv.classList.add('result-reveal');
                }
                lucide.createIcons();

                // Re-enable button
                if (btn) {
                    btn.innerHTML = `<i data-lucide="play" class="w-4 h-4 mr-2"></i> Run Again`;
                    btn.style.pointerEvents = '';
                    btn.style.opacity = '';
                }
                lucide.createIcons();
                checkRunning = false;
            } else {
                score++;
                if (scoreText) scoreText.innerText = score;
                if (circle) circle.style.strokeDashoffset = circumference - (score / 100) * circumference;

                // Dynamic color: green → amber → red as score increases
                if (circle) {
                    if (score < 30) {
                        circle.setAttribute('stroke', '#10b981');
                    } else if (score < 60) {
                        circle.setAttribute('stroke', '#f59e0b');
                    } else {
                        circle.setAttribute('stroke', '#ef4444');
                    }
                }
            }
        }, 25);

        // Scroll result into view
        if (resultSection) resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, totalCheckTime + 400);
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
    }
});
