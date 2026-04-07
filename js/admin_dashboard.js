Store.requireAuth('admin');

lucide.createIcons();

document.addEventListener('DOMContentLoaded', async () => {
    // ---- Initialize Charts First ----

    const planCtx = document.getElementById('planChart').getContext('2d');
    window.planChart = new Chart(planCtx, {
        type: 'doughnut',
        data: {
            labels: ['Basic', 'Standard', 'Pro'],
            datasets: [{ data: [35, 45, 20], backgroundColor: ['#94a3b8', '#14b8a6', '#f59e0b'], borderWidth: 0, hoverOffset: 4 }]
        },
        options: { cutout: '80%', plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', bodyColor: '#fff', borderColor: '#334155', borderWidth: 1 } } }
    });

    // ---- Populate Dashboard Stats ----
    window.updateDashboardStats = async function() {
        const allRiders = await Store.getRiders();
        const activeRiders = allRiders.filter(r => r.onboarded).length;
        document.getElementById('stat-riders').innerText = activeRiders.toLocaleString('en-IN');

        const planPrices = { 'Basic': 49, 'Standard': 99, 'Pro': 149 };
        let premiumSum = 0;
        let basicCount = 0, stdCount = 0, proCount = 0;
        allRiders.forEach(r => {
            if (r.onboarded) {
                const planValue = planPrices[r.plan] || 0;
                premiumSum += planValue;
                if(r.plan === 'Basic') basicCount++;
                else if(r.plan === 'Standard') stdCount++;
                else if(r.plan === 'Pro') proCount++;
            }
        });
        document.getElementById('stat-premium').innerText = '₹' + premiumSum.toLocaleString('en-IN');

        const allClaims = await Store.getClaims();
        let payoutSum = 0;
        allClaims.forEach(c => {
            if (c.status === 'Paid' || c.status === 'Auto-Approved') {
                const val = parseInt(String(c.amount).replace(/[^0-9]/g, '')) || 0;
                payoutSum += val;
            }
        });
        document.getElementById('stat-payouts').innerText = '₹' + payoutSum.toLocaleString('en-IN');
        document.getElementById('stat-fraud').innerText = '0';

        // Chart Dynamics
        if(window.planChart) {
            if(basicCount === 0 && stdCount === 0 && proCount === 0) {
                window.planChart.data.datasets[0].data = [35, 45, 20]; // visually pleasing fallback
                if (document.getElementById('plan-basic-count')) {
                    document.getElementById('plan-basic-count').innerText = "35";
                    document.getElementById('plan-std-count').innerText = "45";
                    document.getElementById('plan-pro-count').innerText = "20";
                    document.getElementById('plan-total-count').innerText = "100";
                }
            } else {
                window.planChart.data.datasets[0].data = [basicCount, stdCount, proCount];
                if (document.getElementById('plan-basic-count')) {
                    document.getElementById('plan-basic-count').innerText = basicCount;
                    document.getElementById('plan-std-count').innerText = stdCount;
                    document.getElementById('plan-pro-count').innerText = proCount;
                    document.getElementById('plan-total-count').innerText = basicCount + stdCount + proCount;
                }
            }
            window.planChart.update();
        }


    };
    
    await updateDashboardStats();

    // ---- Populate Notifications ----
    window.updateNotifications = async function() {
        const allClaims = await Store.getClaims();
        const pendingClaims = allClaims.filter(c => c.status === 'In Review');
        const inReviewCount = pendingClaims.length;
        
        const notifToggle = document.getElementById('notification-toggle');
        if (notifToggle) {
            const badge = notifToggle.querySelector('span');
            if (badge) badge.innerText = inReviewCount;
        }
        const notifMenu = document.getElementById('notification-menu');
        if (notifMenu) {
            const pill = notifMenu.querySelector('.text-[10px]');
            if (pill) pill.innerText = inReviewCount + ' New';
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
    
    window.handleQuickAction = async function(id, newStatus) {
        await Store.updateClaimStatus(id, newStatus);
        if (typeof window.updateNotifications === 'function') await window.updateNotifications();
        window.dispatchEvent(new Event('storage'));
    };
    
    await updateNotifications();

});

// 1. ADVANCED LOCATION LOGIC
async function updateLocation() {
    const locText = document.getElementById('user-location');

    // Strategy: Try Browser Geolocation First (High Accuracy)
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                // Reverse Geocode using free OpenStreetMap API
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await res.json();
                const city = data.address.city || data.address.town || data.address.village || "Unknown Location";
                const state = data.address.state || "";
                locText.innerText = `${city}${state ? ', ' + state : ''}`;
            } catch (e) {
                fallbackToIP();
            }
        }, () => {
            // If user denies location, fallback to IP
            fallbackToIP();
        });
    } else {
        fallbackToIP();
    }
}

async function fallbackToIP() {
    const locText = document.getElementById('user-location');
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        locText.innerText = `${data.city}, ${data.region_code}`;
    } catch (e) {
        locText.innerText = "Delhi NCR"; // Final static fallback
    }
}
updateLocation();

// 2. DROPDOWN TOGGLES
function setupDropdown(btnId, menuId) {
    const btn = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('[id$="-menu"]').forEach(m => {
            if (m.id !== menuId) m.classList.add('hidden');
        });
        menu.classList.toggle('hidden');
    });
}
setupDropdown('notification-toggle', 'notification-menu');
setupDropdown('profile-toggle', 'profile-menu');

document.addEventListener('click', () => {
    document.querySelectorAll('[id$="-menu"]').forEach(m => m.classList.add('hidden'));
});

// Sign out logic
document.getElementById('sidebar-signout').addEventListener('click', () => Store.logout());
document.getElementById('logout-btn').addEventListener('click', () => Store.logout());

// Cross-tab Synchronization
window.addEventListener('storage', (e) => {
    if (e.key === 'gigshield_claims' || e.key === 'gigshield_riders') {
        if (typeof window.updateNotifications === 'function') window.updateNotifications();
        if (typeof window.updateDashboardStats === 'function') window.updateDashboardStats();
    }
});
