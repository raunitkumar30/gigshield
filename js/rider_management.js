Store.requireAuth('admin');

lucide.createIcons();

document.addEventListener('DOMContentLoaded', async () => {

    // ---- populate notifications ----
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
    
    // --- Load and render rider data FIRST (critical path) ---
    try {
        const allRiders = await Store.getRiders();
        // Derive status from the `onboarded` boolean
        allRiders.forEach(r => {
            r._status = r.onboarded ? 'Active' : 'Pending';
        });
        // Render table immediately with all riders
        renderRows(allRiders);
    } catch (e) {
        console.error('Failed to load riders:', e);
    }

    // --- Load notifications in background (non-blocking) ---
    try {
        await updateNotifications();
    } catch (e) {
        console.warn('Failed to load notifications:', e);
    }
});

// 1. ADVANCED LOCATION API
async function fetchLocation() {
    const locText = document.getElementById('user-location');
    if (!locText) return;
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
                const data = await res.json();
                locText.innerText = data.address.city || data.address.town || data.address.village || "Delhi NCR";
            } catch (err) {
                locText.innerText = "Delhi NCR";
            }
        }, async () => {
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                locText.innerText = `${data.city}, ${data.region_code}`;
            } catch (err) {
                locText.innerText = "Delhi NCR";
            }
        });
    }
}
fetchLocation();

// 2. DROPDOWN TOGGLES
function initMenu(btnId, menuId) {
    const btn = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    if (!btn || !menu) return;
    btn.onclick = (e) => {
        e.stopPropagation();
        document.querySelectorAll('[id$="-menu"]').forEach(m => m !== menu && m.classList.add('hidden'));
        menu.classList.toggle('hidden');
    };
}
initMenu('profile-toggle', 'profile-menu');
initMenu('notification-toggle', 'notification-menu');
document.onclick = () => document.querySelectorAll('[id$="-menu"]').forEach(m => m.classList.add('hidden'));

// 3. TABLE RENDERING AND FILTERING LOGIC
window.renderRows = function(data) {
    const container = document.getElementById('tableBody');
    if (!container) return;
    if (data.length === 0) {
        container.innerHTML = `<tr><td colspan="7" class="text-center text-gray-500 py-10"><div class="flex flex-col items-center"><i data-lucide="users" class="w-8 h-8 mb-2 opacity-30 text-teal-500"></i>No riders found matching criteria.</div></td></tr>`;
    } else {
        container.innerHTML = data.map(r => {
            const status = r._status || (r.onboarded ? 'Active' : 'Pending');
            const initial = r.name ? r.name.charAt(0).toUpperCase() : '?';
            const statusClass = status === 'Active'
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-amber-500/10 text-amber-500';
            const planClass = r.plan === 'Pro'
                ? 'bg-amber-400/10 text-amber-400'
                : r.plan === 'Basic'
                    ? 'bg-slate-400/10 text-slate-400'
                    : 'bg-teal-400/10 text-teal-400';
            return `
            <tr class="hover:bg-slate-800/20 transition-colors">
                <td><div class="flex items-center space-x-3">
                    <div class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs bg-teal-900/20 text-teal-400">${initial}</div>
                    <div><div class="font-bold text-sm text-white">${r.name || 'N/A'}</div><div class="text-[10px] text-gray-500">${r.email || ''}</div></div>
                </div></td>
                <td class="text-sm text-gray-400">${r.zone || '—'}</td>
                <td><span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${planClass}">${r.plan || '—'}</span></td>
                <td><span class="text-[10px] font-bold px-2 py-0.5 rounded-md capitalize ${statusClass}">${status}</span></td>
                <td class="text-sm text-gray-400">${r.phone || '—'}</td>
                <td class="text-sm text-gray-400 font-mono text-[11px]">${r.upi_id || '—'}</td>
                <td class="text-sm text-gray-500">${r.id || '—'}</td>
            </tr>`;
        }).join('');
    }
    lucide.createIcons();
};

window.filterBy = async function(status, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const allRiders = await Store.getRiders();
    allRiders.forEach(r => { r._status = r.onboarded ? 'Active' : 'Pending'; });
    renderRows(status === 'all' ? allRiders : allRiders.filter(r => r._status === status));
};

const searchInput = document.getElementById('riderSearch');
if (searchInput) {
    searchInput.oninput = async (e) => {
        const q = e.target.value.toLowerCase();
        const allRiders = await Store.getRiders();
        const queryData = allRiders.filter(r => {
            const searchName = r.name ? r.name.toLowerCase() : '';
            const searchZone = r.zone ? r.zone.toLowerCase() : '';
            return searchName.includes(q) || searchZone.includes(q);
        });
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        const allFilterBtn = document.querySelector('.filter-btn');
        if (allFilterBtn) allFilterBtn.classList.add('active');
        renderRows(queryData);
    };
}

// Sign out logic
const sidebarSignout = document.getElementById('sidebar-signout');
const profileLogout = document.getElementById('logout-btn');
if (sidebarSignout) sidebarSignout.addEventListener('click', () => Store.logout());
if (profileLogout) profileLogout.addEventListener('click', () => Store.logout());

// Cross-tab Synchronization
window.addEventListener('storage', (e) => {
    if (e.key === 'gigshield_claims') {
        if (typeof window.updateNotifications === 'function') window.updateNotifications();
    }
});
