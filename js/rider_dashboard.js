Store.requireAuth('rider');

lucide.createIcons();

document.addEventListener('DOMContentLoaded', async () => {
    // ---- Load current rider data ----
    const rider = await Store.getCurrentRider();
    if (!rider) return;
    const planKey = rider.plan || 'Standard';
    let planCoverage = [];
    if (planKey === 'Pro') {
        planCoverage = [
            { icon: 'cloud-lightning', event: 'Extreme Weather', payout: '500', threshold: 'Severe Conditions' },
            { icon: 'sun', event: 'Heatwave', payout: '250', threshold: '> 38°C' },
            { icon: 'activity', event: 'App Outage', payout: '250', threshold: '> 30 min Offline' }
        ];
    } else if (planKey === 'Standard') {
        planCoverage = [
            { icon: 'cloud-rain', event: 'Heavy Rain', payout: '250', threshold: '> 10mm/hr' },
            { icon: 'sun', event: 'Heatwave', payout: '150', threshold: '> 40°C' },
            { icon: 'alert-circle', event: 'Traffic Gridlock', payout: '100', threshold: 'Severe' }
        ];
    } else {
        planCoverage = [
            { icon: 'cloud-rain', event: 'Severe Rain', payout: '150', threshold: '> 15mm/hr' },
            { icon: 'sun', event: 'Extreme Heat', payout: '100', threshold: '> 42°C' }
        ];
    }

    const plan = {
        name: planKey,
        maxPayout: planKey === 'Pro' ? 1000 : planKey === 'Standard' ? 500 : 250,
        eventsPerWeek: planKey === 'Pro' ? 5 : planKey === 'Standard' ? 3 : 1,
        price: planKey === 'Pro' ? 149 : planKey === 'Standard' ? 99 : 49,
        coverage: planCoverage
    };

    // ---- Update avatar & dropdown ----
    const initial = rider.name ? rider.name.charAt(0).toUpperCase() : '?';
    const avatarEl = document.getElementById('user-avatar');
    if (avatarEl) avatarEl.innerText = initial;
    
    const menuNameEl = document.getElementById('menu-user-name');
    if (menuNameEl) menuNameEl.innerText = rider.name || 'Rider';
    
    const menuEmailEl = document.getElementById('menu-user-email');
    if (menuEmailEl) menuEmailEl.innerText = rider.email || '';

    // ---- Update plan title & zone ----
    const planTitleEl = document.getElementById('plan-title');
    if (planTitleEl) planTitleEl.innerText = `${plan.name} Plan — Active`;
    
    const zoneDisplayEl = document.getElementById('user-zone-display');
    if (zoneDisplayEl) zoneDisplayEl.innerText = rider.zone || 'Sector 18, Noida';

    // ---- Calculate active weeks dynamically ----
    const createdAt = rider.created_at ? new Date(rider.created_at) : new Date();
    const weeksActive = Math.max(1, Math.floor((new Date() - createdAt) / (1000 * 60 * 60 * 24 * 7)) + 1);
    const weekDisplayEl = document.getElementById('user-week-display');
    if (weekDisplayEl) weekDisplayEl.innerText = `Week ${weeksActive}`;

    // ---- Update stat boxes ----
    const maxPayoutEl = document.getElementById('stat-max-payout');
    if (maxPayoutEl) maxPayoutEl.innerText = `₹${plan.maxPayout.toLocaleString('en-IN')}`;
    
    const eventsEl = document.getElementById('stat-events');
    if (eventsEl) eventsEl.innerText = plan.eventsPerWeek;
    
    const premiumEl = document.getElementById('stat-premium');
    if (premiumEl) premiumEl.innerText = `₹${plan.price}`;

    // ---- Populate coverage cards ----
    const container = document.getElementById('coverage-container');
    if (container) {
        container.innerHTML = plan.coverage.map((c, idx) => `
            <div class="coverage-card">
                <div class="flex items-center text-white mb-2">
                    <i data-lucide="${c.icon}" class="w-4 h-4 mr-2 text-gray-400"></i>
                    <span class="font-bold text-sm">${c.event}</span>
                </div>
                <p class="text-xl font-bold text-teal-400">₹${c.payout}</p>
                <p class="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest mb-4">${c.threshold}</p>
                <button id="btn-claim-${idx}" onclick="fileClaim('${c.event}', '₹${c.payout}', ${idx})" class="w-full py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/30 rounded-lg text-xs font-bold transition-all flex items-center justify-center">
                    <i data-lucide="plus-circle" class="w-3.5 h-3.5 mr-1.5"></i> Report Issue
                </button>
            </div>
        `).join('');
    }
    lucide.createIcons();
});

// ---- Rider File Claim Logic ----
window.fileClaim = async function(eventName, amount, index) {
    const rider = await Store.getCurrentRider();
    if (!rider) return;
    await Store.createClaim(rider.email, eventName, amount);
    
    const btn = document.getElementById('btn-claim-' + index);
    if (btn) {
        btn.innerHTML = `<i data-lucide="check-circle" class="w-3.5 h-3.5 mr-1.5"></i> Claim Submitted`;
        btn.className = "w-full py-2 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-not-allowed opacity-80";
        btn.disabled = true;
    }
    lucide.createIcons();
    
    alert('Claim submitted successfully! The Admin has been notified.');
};

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

// ---- Upgrade Plan Logic ----
window.openUpgradeModal = async function() {
    const rider = await Store.getCurrentRider();
    if (!rider) return;
    const currentPlan = rider.plan || 'Standard';
    const radios = document.querySelectorAll('input[name="plan-selection"]');
    radios.forEach(r => {
        if(r.value === currentPlan) r.checked = true;
    });
    const modal = document.getElementById('upgrade-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closeUpgradeModal = function() {
    const modal = document.getElementById('upgrade-modal');
    if (modal) modal.classList.add('hidden');
};

window.submitPlanUpgrade = async function() {
    const btn = document.getElementById('btn-confirm-upgrade');
    const rider = await Store.getCurrentRider();
    if (!rider) return;
    const checked = document.querySelector('input[name="plan-selection"]:checked');
    if (!checked) return;
    const selectedPlan = checked.value;
    
    if (selectedPlan === rider.plan) {
        alert('You are already on this plan!');
        return;
    }
    
    if (btn) {
        btn.innerHTML = 'Updating...';
        btn.disabled = true;
        btn.classList.add('opacity-70', 'cursor-not-allowed');
    }

    await Store.updateRider(rider.email, { plan: selectedPlan });
    alert(`Success! You have switched to the ${selectedPlan} Plan.`);
    window.location.reload(); 
};

// ---- Logout ----
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        Store.logout();
    });
}
