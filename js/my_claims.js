Store.requireAuth('rider');

lucide.createIcons();

document.addEventListener('DOMContentLoaded', async () => {
    // ---- Load rider data ----
    const rider = await Store.getCurrentRider();
    if (!rider) return;

    // ---- Update avatar & dropdown ----
    const avatarEl = document.getElementById('user-avatar');
    const nameEl = document.getElementById('menu-user-name');
    const emailEl = document.getElementById('menu-user-email');

    const initial = rider.name ? rider.name.charAt(0).toUpperCase() : '?';
    if (avatarEl) avatarEl.innerText = initial;
    if (nameEl) nameEl.innerText = rider.name || 'Rider';
    if (emailEl) emailEl.innerText = rider.email || '';

    // ---- Populate claims table and stats from Store ----
    window.renderMyClaims = async function() {
        const myClaims = await Store.getClaimsByEmail(rider.email);
        
        let totalRec = 0;
        myClaims.forEach(c => {
            if(c.status === 'Paid' || c.status === 'Auto-Approved') {
                const val = parseInt(String(c.amount).replace(/[^0-9]/g, '')) || 0;
                totalRec += val;
            }
        });

        const totalClaimsEl = document.getElementById('stat-total-claims');
        const totalRecEl = document.getElementById('stat-total-received');
        const approvalRateEl = document.getElementById('stat-approval-rate');

        if (totalClaimsEl) totalClaimsEl.innerText = myClaims.length;
        if (totalRecEl) totalRecEl.innerText = '₹' + totalRec.toLocaleString('en-IN');
        
        const autoApproved = myClaims.filter(c => c.status === 'Auto-Approved' || c.status === 'Paid').length;
        const approvalRate = myClaims.length > 0 ? Math.round((autoApproved / myClaims.length) * 100) + '%' : '100%';
        if (approvalRateEl) approvalRateEl.innerText = approvalRate;

        const tbody = document.getElementById('claims-tbody');
        if (!tbody) return;

        if (myClaims.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 py-10"><i data-lucide="folder-open" class="w-8 h-8 mx-auto mb-2 opacity-30 text-teal-500"></i>No active claims to review.</td></tr>`;
        } else {
            tbody.innerHTML = myClaims.map(c => `
                <tr>
                    <td class="font-bold">${c.event_type}</td>
                    <td class="text-blue-400/80">${new Date(c.created_at).toLocaleDateString()}</td>
                    <td class="text-gold font-bold text-lg">${c.amount}</td>
                    <td><span class="status-badge-paid">${c.status}</span></td>
                    <td class="text-gray-500 font-mono text-xs">N/A</td>
                </tr>
            `).join('');
        }
        lucide.createIcons();
    };
    
    await renderMyClaims();
});

// ---- Profile Dropdown Toggle ----
const profileToggle = document.getElementById('profile-toggle');
const profileMenu = document.getElementById('profile-menu');

if (profileToggle && profileMenu) {
    profileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        if (!profileMenu.classList.contains('hidden')) {
            profileMenu.classList.add('hidden');
        }
    });

    profileMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// ---- Logout ----
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        Store.logout();
    });
}

// ---- Live Sync Listener ----
window.addEventListener('storage', (e) => {
    if (e.key === 'gigshield_claims' && typeof window.renderMyClaims === 'function') {
        window.renderMyClaims();
    }
});
