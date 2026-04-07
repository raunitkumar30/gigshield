Store.requireAuth('rider');

lucide.createIcons();

document.addEventListener('DOMContentLoaded', async () => {
    // ---- Load rider data ----
    const rider = await Store.getCurrentRider();
    if (!rider) return;
    const prices = { 'Basic': 49, 'Standard': 99, 'Pro': 149 };
    const planName = rider.plan || 'Standard';
    const planPrice = prices[planName] || 99;

    // ---- Update avatar & dropdown ----
    const avatarEl = document.getElementById('user-avatar');
    const nameEl = document.getElementById('menu-user-name');
    const emailEl = document.getElementById('menu-user-email');

    const initial = rider.name ? rider.name.charAt(0).toUpperCase() : '?';
    if (avatarEl) avatarEl.innerText = initial;
    if (nameEl) nameEl.innerText = rider.name || 'Rider';
    if (emailEl) emailEl.innerText = rider.email || '';

    // ---- Update AutoPay banner dynamically ----
    const upi = rider.upi_id || rider.upiId || 'rider@okaxis';
    const headlineEl = document.getElementById('autopay-headline');
    const detailEl = document.getElementById('autopay-detail');

    if (headlineEl) headlineEl.innerText = `Next deduction: ₹${planPrice} on Mon 6 Apr at 6:00 AM`;
    if (detailEl) detailEl.innerText = `AutoPay via ${upi} · ${planName} Plan`;

    // ---- Populate payment history from real DB data ----
    const tbody = document.getElementById('payments-tbody');
    if (!tbody) return;

    // Try to fetch real payouts for this rider from Supabase
    let riderPayments = [];
    try {
        const allPayouts = await Store.getPayouts();
        riderPayments = allPayouts.filter(p => {
            const payoutRider = (p.rider || p.rider_email || '').toLowerCase();
            return payoutRider === (rider.email || '').toLowerCase()
                || payoutRider === (rider.name || '').toLowerCase();
        });
    } catch (e) {
        console.warn('Could not fetch payouts:', e);
    }

    if (rider.onboarded) {
        const today = new Date();
        const setupDate = today.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        riderPayments.push({
            time: `Setup Payment (${setupDate})`,
            amount: '₹' + planPrice,
            plan: planName
        });
    }

    if (riderPayments.length === 0) {
        // Clean empty state for new riders with no payment history
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-10">
                    <div class="flex flex-col items-center space-y-3">
                        <div class="p-3 bg-slate-800/50 rounded-full">
                            <i data-lucide="credit-card" class="w-6 h-6 text-gray-600"></i>
                        </div>
                        <p class="text-gray-500 text-sm">No payment history yet.</p>
                        <p class="text-gray-600 text-xs">Your first premium deduction of <span class="text-teal-400 font-bold">₹${planPrice}</span> is scheduled for your upcoming AutoPay date.</p>
                    </div>
                </td>
            </tr>`;
        lucide.createIcons();
    } else {
        // Render actual payment history
        tbody.innerHTML = riderPayments.map(p => `
            <tr>
                <td class="font-bold text-white">${p.time || p.created_at || 'Recent'}</td>
                <td class="text-blue-400/70">${planName}</td>
                <td class="font-bold text-white">${p.amount || '₹' + planPrice}</td>
                <td><span class="status-badge-paid">PAID</span></td>
            </tr>
        `).join('');
    }
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
