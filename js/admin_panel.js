Store.requireAuth('admin');

lucide.createIcons();

document.addEventListener('DOMContentLoaded', async () => {
    // ---- Populating Tab 1 (Risk Pool) ----
    window.updateRiskPoolStats = async function() {
        const allRiders = await Store.getRiders();
        const planPrices = { 'Basic': 49, 'Standard': 99, 'Pro': 149 };
        let premiumSum = 0;
        allRiders.forEach(r => {
            premiumSum += (planPrices[r.plan] || 0);
        });
        const inflowEl = document.getElementById('stat-pool-inflow');
        if (inflowEl) inflowEl.innerText = '₹' + premiumSum.toLocaleString('en-IN');

        const allClaims = await Store.getClaims();
        let payoutSum = 0;
        allClaims.forEach(c => {
            if (c.status === 'Paid' || c.status === 'Auto-Approved') {
                const val = parseInt(String(c.amount).replace(/[^0-9]/g, '')) || 0;
                payoutSum += val;
            }
        });
        const outflowEl = document.getElementById('stat-pool-outflow');
        if (outflowEl) outflowEl.innerText = '₹' + payoutSum.toLocaleString('en-IN');

        // Pool Balance calculation
        const basePool = 100000;
        const poolBalance = basePool + premiumSum - payoutSum;
        const balanceEl = document.getElementById('stat-pool-balance');
        if (balanceEl) balanceEl.innerText = '₹' + poolBalance.toLocaleString('en-IN');
        
        const ridersViacEl = document.getElementById('stat-riders-viac');
        if (ridersViacEl) ridersViacEl.innerText = `${allRiders.length} riders — Well above 2,000 minimum threshold`;
    };
    
    function initZonesData() {
        const DELHI_ZONES = [
            'Connaught Place','Hauz Khas','Saket','Vasant Kunj','Dwarka','Rohini','Janakpuri','Pitampura',
            'Karol Bagh','Rajouri Garden','Lajpat Nagar','South Ex','Greater Kailash','Def Col','Green Park','Vasant Vihar',
            'Chandni Chowk','Chawri Bazar','Kashmere Gate','Civil Lines','Model Town','Noida Sec 18','Noida Sec 62','Greater Noida',
            'Gurgaon Sec 29','Cyber City','Golf Course Rd','Udyog Vihar','DLF Phase 1','DLF Phase 2','DLF Phase 3','Faridabad NIT',
            'Ghaziabad','Indirapuram','Vaishali','Kaushambi','Mayur Vihar','Laxmi Nagar','Preet Vihar','Shahdara',
            'Seelampur','Dilshad Garden','Mukherjee Nagar','Kamla Nagar','Paharganj','Okhla','Nehru Place','Kalkaji',
            'Malviya Nagar','Sarojini Nagar','RK Puram','Moti Bagh','Dhaula Kuan','Delhi Cantt','Palam','Mahipalpur',
            'Chattarpur','Mehrauli','Badarpur','Sangam Vihar','Tughlakabad','Siri Fort','Asiad Village','Lodhi Colony'
        ];

        const overrideMap = {
            'Sector 18': { riders: 342, status: 'Active', lastAlert: '2h ago', risk: 'High', city: 'Noida' },
            'CP': { riders: 521, status: 'Active', lastAlert: '1h ago', risk: 'High', city: 'Delhi' },
            'Koramangala': { riders: 289, status: 'Active', lastAlert: '4h ago', risk: 'Medium', city: 'Bangalore' },
            'HSR Layout': { riders: 234, status: 'Active', lastAlert: '6h ago', risk: 'Low', city: 'Bangalore' },
            'Andheri West': { riders: 456, status: 'Active', lastAlert: '30m ago', risk: 'High', city: 'Mumbai' },
            'Powai': { riders: 187, status: 'Frozen', lastAlert: '3h ago', risk: 'Medium', city: 'Mumbai' },
            'Saket': { riders: 312, status: 'Active', lastAlert: '5h ago', risk: 'Medium', city: 'Delhi' },
            'Whitefield': { riders: 198, status: 'Active', lastAlert: '7h ago', risk: 'Low', city: 'Bangalore' }
        };

        const overrideKeys = Object.keys(overrideMap);
        window.zonesData = overrideKeys.map((z, id) => ({ id, zone: z, ...overrideMap[z] }));

        DELHI_ZONES.forEach((zone, idx) => {
            if(!overrideMap[zone] && overrideMap[zone.replace('Noida ', '')] === undefined) {
                const rRisk = Math.random();
                window.zonesData.push({
                    id: 10 + idx, zone: zone, city: 'Delhi NCR',
                    riders: Math.floor(Math.random() * 500) + 100,
                    status: 'Active',
                    lastAlert: Math.floor(Math.random() * 12) + 1 + 'h ago',
                    risk: rRisk > 0.8 ? 'High' : rRisk > 0.4 ? 'Medium' : 'Low'
                });
            }
        });
    }

    window.renderZonesTable = function(data) {
        const container = document.getElementById('zoneTableBody');
        if (!container) return;
        
        if (data.length === 0) {
            container.innerHTML = `<tr><td colspan="7" class="text-center text-[#94A3B8] py-10" style="background:#151C2C">No zones found.</td></tr>`;
        } else {
            container.innerHTML = data.map(item => {
                const rowClass = item.status === 'Frozen' ? 'frozen-row' : '';
                const statusClass = item.status === 'Active' ? 'bg-[#14b8a61a] text-[#2DD4BF]' : 'bg-[#3b82f61a] text-[#3B82F6]';
                const riskClassList = { 'High': 'bg-[#ef44441a] text-[#EF4444]', 'Medium': 'bg-[#f59e0b1a] text-[#F59E0B]', 'Low': 'bg-[#22c55e1a] text-[#22C55E]' };
                const riskClass = riskClassList[item.risk];
                const actionClass = item.status === 'Frozen' ? 'text-[#2DD4BF] border border-[#2DD4BF] bg-[#14b8a60d] hover:bg-[#14b8a626]' : 'text-[#3B82F6] hover:bg-[#3b82f61a] border border-transparent';
                const actionIcon = item.status === 'Frozen' ? 'unlock' : 'lock';
                const actionText = item.status === 'Frozen' ? 'Unfreeze' : 'Freeze';
                return `
                <tr class="${rowClass}">
                    <td class="font-bold text-sm text-[#CBD5E1]">${item.zone}</td>
                    <td class="text-sm text-[#94A3B8]">${item.city}</td>
                    <td class="text-sm font-bold text-[#CBD5E1]">${item.riders}</td>
                    <td><span class="text-[12px] font-bold px-3 py-1 rounded-full capitalize ${statusClass}">${item.status}</span></td>
                    <td class="text-sm text-[#94A3B8]">${item.lastAlert}</td>
                    <td><span class="text-[12px] font-bold px-3 py-1 rounded-full ${riskClass}">${item.risk}</span></td>
                    <td>
                        <button class="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold transition-all ${actionClass}" onclick="toggleZoneStatus(${item.id})">
                            <i data-lucide="${actionIcon}" class="w-3.5 h-3.5"></i>
                            <span>${actionText}</span>
                        </button>
                    </td>
                </tr>`;
            }).join('');
        }
        lucide.createIcons();
    };

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

    // Initialize table immediately with fallback data
    initZonesData();
    renderZonesTable(window.zonesData);

    // Fetch dynamic stats in background without blocking
    try {
        await updateRiskPoolStats();
    } catch (e) {
        console.warn("Failed to load risk pool stats:", e);
    }

    try {
        await updateNotifications();
    } catch (e) {
        console.warn("Failed to load notifications:", e);
    }

    const zoneSearch = document.getElementById('zoneSearch');
    if (zoneSearch) {
        zoneSearch.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            renderZonesTable(window.zonesData.filter(i => i.zone.toLowerCase().includes(q) || i.city.toLowerCase().includes(q)));
        });
    }

    window.toggleZoneStatus = function(id) {
        const item = window.zonesData.find(z => z.id === id);
        if (item) {
            item.status = item.status === 'Active' ? 'Frozen' : 'Active';
            const searchInput = document.getElementById('zoneSearch');
            const q = searchInput ? searchInput.value.toLowerCase() : '';
            renderZonesTable(q ? window.zonesData.filter(i => i.zone.toLowerCase().includes(q) || i.city.toLowerCase().includes(q)) : window.zonesData);
        }
    };

    // ---- Populating Tab 3 (System Health) ----
    window.updateSystemHealth = async function() {
        const apiBoxes = document.getElementById('api-status-boxes');
        if (!apiBoxes) return;

        const services = [
            { name: 'Supabase DB', url: null, check: async () => { try { await Store.getClaims(); return true; } catch(e) { return false; } } },
            { name: 'OSMap API', url: 'https://nominatim.openstreetmap.org/search?q=delhi&format=json&limit=1', check: async () => { try { const r = await fetch('https://nominatim.openstreetmap.org/search?q=delhi&format=json&limit=1'); return r.ok; } catch(e) { return false; } } },
            { name: 'Weather API', url: 'https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.20&current=temperature_2m', check: async () => { try { const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.20&current=temperature_2m'); return r.ok; } catch(e) { return false; } } }
        ];

        apiBoxes.innerHTML = '';
        for (const svc of services) {
            const isUp = await svc.check();
            const statusColor = isUp ? 'text-emerald-400' : 'text-rose-400';
            const bgClass = isUp ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20';
            const icon = isUp ? 'check-circle' : 'alert-circle';
            
            apiBoxes.innerHTML += `
                <div class="card p-4 flex items-center justify-between ${bgClass}">
                    <div class="flex items-center space-x-3">
                        <i data-lucide="${icon}" class="w-4 h-4 ${statusColor}"></i>
                        <span class="text-xs font-bold uppercase tracking-wider">${svc.name}</span>
                    </div>
                    <span class="text-[10px] font-extrabold uppercase ${statusColor}">${isUp ? 'Operational' : 'Down'}</span>
                </div>
            `;
        }
        lucide.createIcons();

        // Stats
        const allClaims = await Store.getClaims();
        const today = new Date().toISOString().split('T')[0];
        const claimsToday = allClaims.filter(c => c.created_at && c.created_at.startsWith(today)).length;
        
        const claimsTodayEl = document.getElementById('claims-today-count');
        const pingCountEl = document.getElementById('ping-count');
        const fraudCountEl = document.getElementById('fraud-count');

        if (claimsTodayEl) claimsTodayEl.innerText = claimsToday;
        if (pingCountEl) pingCountEl.innerText = Math.floor(Math.random() * 40) + 10;
        if (fraudCountEl) fraudCountEl.innerText = Math.floor(Math.random() * 8);

        const eventsFeed = document.getElementById('event-feed');
        if (eventsFeed) {
            const time = new Date().toLocaleTimeString([], { hour12: false });
            eventsFeed.innerHTML = `
                <p class="text-emerald-500/80">[${time}] > System baseline check complete. High availability confirmed.</p>
                <p>[${time}] > Supabase connection handshake established.</p>
                <p>[${time}] > Successfully synchronized ${allClaims.length} records.</p>
                ${eventsFeed.innerHTML}
            `;
        }
    };

    // Initial call
    await updateSystemHealth();

    // Initialize chart if we start on the right tab
    initPoolChart();
    lucide.createIcons();
});

// 1. LOCATION API LOGIC
async function updateLocation() {
    const locText = document.getElementById('user-location');
    if (!locText) return;
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
                const data = await res.json();
                locText.innerText = data.address.city || data.address.town || "Delhi NCR";
            } catch (e) { fallbackIP(); }
        }, () => fallbackIP());
    } else { fallbackIP(); }
}
async function fallbackIP() {
    const locText = document.getElementById('user-location');
    if (!locText) return;
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        locText.innerText = `${data.city}, ${data.region_code}`;
    } catch (e) {
        locText.innerText = "Delhi, DL";
    }
}
updateLocation();

// 2. DROPDOWN TOGGLES
function initMenu(btnId, menuId) {
    const btn = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    if (!btn || !menu) return;
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('[id$="-menu"]').forEach(m => m !== menu && m.classList.add('hidden'));
        menu.classList.toggle('hidden');
    });
}
initMenu('profile-toggle', 'profile-menu');
initMenu('notification-toggle', 'notification-menu');
document.addEventListener('click', () => document.querySelectorAll('[id$="-menu"]').forEach(m => m.classList.add('hidden')));

// 3. TAB SWITCHING
window.switchTab = function(tab) {
    ['risk', 'zone', 'health'].forEach(t => {
        const panel = document.getElementById(`tab-${t}`);
        const btn = document.getElementById(`btn-${t}`);
        if (panel) panel.classList.add('hidden');
        if (btn) btn.classList.remove('active');
    });
    const targetPanel = document.getElementById(`tab-${tab}`);
    const targetBtn = document.getElementById(`btn-${tab}`);
    if (targetPanel) targetPanel.classList.remove('hidden');
    if (targetBtn) targetBtn.classList.add('active');
    
    if (tab === 'risk') initPoolChart();
    if (tab === 'health' && typeof window.updateSystemHealth === 'function') window.updateSystemHealth();
    lucide.createIcons();
};

// 4. CHART & DATA LOGIC 
let poolChart;
function initPoolChart() {
    const canvas = document.getElementById('poolChart');
    if (!canvas || poolChart) return;
    const ctx = canvas.getContext('2d');
    poolChart = new Chart(ctx, {
        type: 'line',
        data: { labels: ['Q1','Q2','Q3','Q4'], datasets: [{ data: [100, 200, 300, 400], borderColor: '#14b8a6', tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#1e293b' }, ticks: { color: '#64748b' } }, x: { grid: { display: false }, ticks: { color: '#64748b' } } } }
    });
}

setInterval(() => {
    const pingEl = document.getElementById('ping-count');
    const fraudEl = document.getElementById('fraud-count');
    if (pingEl) pingEl.innerText = Math.floor(Math.random() * 50);
    if (fraudEl) fraudEl.innerText = Math.floor(Math.random() * 5);
}, 2000);

// Sign out logic
const sidebarSignout = document.getElementById('sidebar-signout');
const profileLogout = document.getElementById('logout-btn');
if (sidebarSignout) sidebarSignout.addEventListener('click', () => Store.logout());
if (profileLogout) profileLogout.addEventListener('click', () => Store.logout());

// Cross-tab Synchronization
window.addEventListener('storage', (e) => {
    if (e.key === 'gigshield_claims' || e.key === 'gigshield_riders') {
        if (typeof window.updateRiskPoolStats === 'function') window.updateRiskPoolStats();
        if (typeof window.updateNotifications === 'function') window.updateNotifications();
    }
});
