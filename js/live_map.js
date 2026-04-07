Store.requireAuth('admin');

lucide.createIcons();

/* ===========================================================
 *  TOAST NOTIFICATION SYSTEM
 *  showToast(message, type)  —  type: 'alert' | 'info' | 'success'
 * =========================================================*/
window.showToast = function(message, type) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const colorMap = {
        alert:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  text: '#f87171', icon: 'alert-triangle' },
        info:    { bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.3)', text: '#38bdf8', icon: 'loader'         },
        success: { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)', text: '#34d399', icon: 'check-circle'   }
    };
    const c = colorMap[type] || colorMap.info;

    const toast = document.createElement('div');
    toast.className = 'toast-enter pointer-events-auto flex items-start space-x-3 px-5 py-4 rounded-2xl backdrop-blur-md shadow-2xl';
    toast.style.cssText = `background:${c.bg};border:1px solid ${c.border}`;
    toast.innerHTML = `
        <i data-lucide="${c.icon}" class="w-5 h-5 shrink-0 mt-0.5" style="color:${c.text}"></i>
        <p class="text-sm font-semibold leading-snug" style="color:${c.text}">${message}</p>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        toast.addEventListener('animationend', () => toast.remove());
    }, 4000);
};

/* ===========================================================
 *  INITIALIZATION
 * =========================================================*/
document.addEventListener('DOMContentLoaded', async () => {

    // ---- Populate notifications ----
    window.updateNotifications = async function() {
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

    window.handleQuickAction = async function(id, newStatus) {
        await Store.updateClaimStatus(id, newStatus);
        if (typeof window.updateNotifications === 'function') await window.updateNotifications();
        window.dispatchEvent(new Event('storage'));
    };

    await updateNotifications();

    // --- Live Weather Initialization ---
    const citySelect = document.getElementById('city-select');
    if (citySelect) {
        citySelect.addEventListener('change', (e) => {
            fetchLiveWeather(e.target.value);
            renderGrid(e.target.value);
            syncLiveMap();
        });
        
        // Initial fetch based on default select
        const initialCity = citySelect.value || 'Delhi NCR';
        fetchLiveWeather(initialCity);
        renderGrid(initialCity);
    }
    
    // Fetch live claims shortly after grid paints
    setTimeout(() => syncLiveMap(), 500);
});

/* ===========================================================
 *  DYNAMIC ZONE NAMES AND GRID GENERATION
 * =========================================================*/
const CITY_ZONES = {
    'Delhi NCR': [
        'Connaught Place','Hauz Khas','Saket','Vasant Kunj','Dwarka','Rohini','Janakpuri','Pitampura',
        'Karol Bagh','Rajouri Garden','Lajpat Nagar','South Ex','Greater Kailash','Def Col','Green Park','Vasant Vihar',
        'Chandni Chowk','Chawri Bazar','Kashmere Gate','Civil Lines','Model Town','Noida Sec 18','Noida Sec 62','Greater Noida',
        'Gurgaon Sec 29','Cyber City','Golf Course Rd','Udyog Vihar','DLF Phase 1','DLF Phase 2','DLF Phase 3','Faridabad NIT',
        'Ghaziabad','Indirapuram','Vaishali','Kaushambi','Mayur Vihar','Laxmi Nagar','Preet Vihar','Shahdara',
        'Seelampur','Dilshad Garden','Mukherjee Nagar','Kamla Nagar','Paharganj','Okhla','Nehru Place','Kalkaji',
        'Malviya Nagar','Sarojini Nagar','RK Puram','Moti Bagh','Dhaula Kuan','Delhi Cantt','Palam','Mahipalpur',
        'Chattarpur','Mehrauli','Badarpur','Sangam Vihar','Tughlakabad','Siri Fort','Asiad Village','Lodhi Colony'
    ],
    'Mumbai': [
        'Colaba','Fort','Churchgate','Nariman Point','Marine Drive','Malabar Hill','Breach Candy','Cumbala Hill',
        'Tardeo','Mumbai Central','Byculla','Parel','Lower Parel','Worli','Mahalaxmi','Prabhadevi',
        'Dadar','Matunga','Sion','Mahim','Bandra West','Bandra East','Khar','Santacruz',
        'Vile Parle','Andheri West','Andheri East','Jogeshwari','Goregaon','Malad','Kandivali','Borivali',
        'Dahisar','Kurla','Vidyavihar','Ghatkopar','Vikhroli','Kanjurmarg','Bhandup','Mulund',
        'Powai','Chandivali','Saki Naka','Chembur','Govandi','Mankhurd','Navi Mumbai','Vashi',
        'Nerul','CBD Belapur','Kharghar','Panvel','Thane','Kalyan','Dombivli','Ulhasnagar',
        'Bhiwandi','Mira Road','Bhayandar','Vasai','Virar','Nalasopara','Palghar','Boisar'
    ],
    'Bangalore': [
        'Koramangala','Indiranagar','Whitefield','Marathahalli','Bellandur','HSR Layout','BTM Layout','Jayanagar',
        'JP Nagar','Banashankari','Basavanagudi','Malleswaram','Rajajinagar','Sadashivanagar','Hebbal','Yelahanka',
        'Manyata Tech Pk','RT Nagar','Frazer Town','Cox Town','Cooke Town','Ulsoor','MG Road','Brigade Road',
        'Commercial St','Richmond Town','Langford Town','Shanti Nagar','Wilson Garden','Domlur','CV Raman Nagar','Bennigana Halli',
        'KR Puram','Mahadevapura','Brookefield','Kadugodi','Varthur','Sarjapur Rd','Electronic City','Bommanahalli',
        'Silk Board','Madiwala','Tavarekere','Adugodi','Nagarbhavi','Kengeri','RR Nagar','Nayandahalli',
        'Vijay Nagar','Basaveshwaranagar','Yeshwanthpur','Peenya','Dasarahalli','Jalahalli','Mathikere','Vidyaranyapura',
        'Sahakar Nagar','Kalyan Nagar','Kammanahalli','Hennur','Banaswadi','Ramamurthy Ngr','Kaggadasapura','Dommasandra'
    ]
};

window.renderGrid = function(cityName) {
    const grid = document.getElementById('gridContainer');
    const title = document.getElementById('grid-title');
    if (!grid) return;
    
    grid.innerHTML = '';
    const zones = CITY_ZONES[cityName] || CITY_ZONES['Delhi NCR'];
    
    if (title) title.innerText = `${cityName} — Zone Grid (${zones.length})`;
    
    zones.forEach((zoneName, index) => {
        const div = document.createElement('div');
        div.className = 'zone-pill hover:shadow-md'; 
        div.id = `zone-${index}`;
        div.title = zoneName; 
        div.innerText = zoneName;
        grid.appendChild(div);
    });
    // Clear alerts on city change
    clearMap();
};

/* ===========================================================
 *  LIVE WEATHER API
 * =========================================================*/
const CITY_COORDS = {
    'Delhi NCR': { lat: 28.6139, lon: 77.2090 },
    'Mumbai': { lat: 19.0760, lon: 72.8777 },
    'Bangalore': { lat: 12.9716, lon: 77.5946 }
};

window.fetchLiveWeather = async function(cityName) {
    const coords = CITY_COORDS[cityName] || CITY_COORDS['Delhi NCR'];
    
    const aqiEl = document.getElementById('val-aqi');
    const rainEl = document.getElementById('val-rain');
    const tempEl = document.getElementById('val-temp');
    const windEl = document.getElementById('val-wind');

    if (aqiEl) aqiEl.innerText = '...';
    if (rainEl) rainEl.innerText = '...';
    if (tempEl) tempEl.innerText = '...';
    if (windEl) windEl.innerText = '...';

    try {
        // Fetch Weather
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,rain,wind_speed_10m`);
        const weatherData = await weatherRes.json();
        
        // Fetch AQI
        const aqiRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords.lat}&longitude=${coords.lon}&current=us_aqi`);
        const aqiData = await aqiRes.json();

        const temp = weatherData.current.temperature_2m;
        const rain = weatherData.current.rain;
        const wind = weatherData.current.wind_speed_10m;
        const aqi = aqiData.current.us_aqi;

        if (tempEl) tempEl.innerText = `${temp}°C`;
        if (windEl) windEl.innerText = `${wind} km/h`;
        
        if (rainEl) {
            rainEl.innerText = `${rain}mm`;
            rainEl.className = rain > 0 ? 'text-xl font-bold text-rose-500' : 'text-xl font-bold text-cyan-400';
        }

        if (aqiEl) {
            aqiEl.innerText = aqi;
            aqiEl.className = aqi > 150 ? 'text-xl font-bold text-rose-500' : 'text-xl font-bold text-amber-500';
        }

        // Auto trigger simulation if rain is significant
        if (rain > 5 || aqi > 300) {
            showToast(`⚠️ Severe weather detected in ${cityName}. Live disruption triggered!`, 'alert');
            setTimeout(() => simulateDisruption(), 1000);
        }

    } catch (err) {
        console.error("Weather fetch failed:", err);
        resetWeatherStats(); // fallback
    }
};

// Fallback for failed requests or clearing
function resetWeatherStats() {
    const aqiEl = document.getElementById('val-aqi');
    const rainEl = document.getElementById('val-rain');
    const tempEl = document.getElementById('val-temp');
    const windEl = document.getElementById('val-wind');

    if (aqiEl) aqiEl.innerText = '0';
    if (rainEl) rainEl.innerText = '0mm';
    if (tempEl) tempEl.innerText = '0°C';
    if (windEl) windEl.innerText = '0 km/h';

    // Reset colors
    if (aqiEl) aqiEl.className = 'text-xl font-bold text-amber-500';
    if (rainEl) rainEl.className = 'text-xl font-bold text-cyan-400';
    if (tempEl) tempEl.className = 'text-xl font-bold';
    if (windEl) windEl.className = 'text-xl font-bold';
}

function spikeWeatherStats() {
    const rainEl = document.getElementById('val-rain');
    if (rainEl && (parseInt(rainEl.innerText) === 0 || isNaN(parseInt(rainEl.innerText)))) {
        rainEl.innerText = '> 5mm';
        rainEl.className = 'text-xl font-bold text-rose-500';
    }
}

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
 *  DROPDOWN TOGGLES (Bell + Profile)
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
 *  LIVE MAP DATA SYNC (SUPABASE)
 * =========================================================*/
window.syncLiveMap = async function() {
    clearZones();
    
    const citySelect = document.getElementById('city-select');
    const currentCity = citySelect ? citySelect.value : 'Delhi NCR';
    const cityNames = CITY_ZONES[currentCity] || CITY_ZONES['Delhi NCR'];
    
    const allClaims = await Store.getClaims();
    
    // Only care about claims for this city's zones
    let activeClaims = [];
    
    allClaims.forEach(c => {
        const zoneIndex = cityNames.indexOf(c.zone);
        if (zoneIndex !== -1) {
            activeClaims.push({...c, idx: zoneIndex});
            
            const el = document.getElementById(`zone-${zoneIndex}`);
            if (el) {
                if (c.status === 'In Review') {
                    el.classList.add('alert');
                } else if (c.status === 'Paid' || c.status === 'Auto-Approved') {
                    el.classList.remove('alert');
                    el.classList.add('payout-complete');
                }
            }
        }
    });
    
    renderAlertsList(activeClaims);
};

function renderAlertsList(claims) {
    const list = document.getElementById('alertList');
    const countLabel = document.getElementById('alertCount');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (claims.length === 0) {
        list.innerHTML = '<p class="text-xs text-gray-600 text-center mt-20">No active alerts or payouts.</p>';
        if (countLabel) countLabel.innerText = '0 active';
        return;
    }
    
    if (countLabel) countLabel.innerText = `${claims.length} claims`;
    
    claims.forEach(c => {
        const isPaid = c.status === 'Paid' || c.status === 'Auto-Approved';
        const bg = isPaid ? 'bg-teal-500/10 border-teal-500/20' : 'bg-rose-500/10 border-rose-500/20';
        const textCol = isPaid ? 'text-teal-400' : 'text-rose-500';
        const statusHtml = isPaid 
            ? `<span class="flex items-center shrink-0"><i data-lucide="check-circle" class="w-3 h-3 mr-1"></i> Paid</span>`
            : `<span class="shrink-0 flex items-center"><span class="w-2 h-2 bg-rose-500 rounded-full mr-1.5 animate-pulse"></span> In Review</span>`;
        
        const item = document.createElement('div');
        item.className = `p-3 mb-2 border rounded-lg ${bg}`;
        item.innerHTML = `
            <div class="flex justify-between items-center font-bold text-xs ${textCol}">
                <span class="truncate pr-2">${c.zone}</span>${statusHtml}
            </div>
            <div class="text-[10px] text-gray-400 mt-1">${c.rider_email || 'Unknown Rider'} 
                <span class="font-bold ml-1 text-white">${c.amount || '₹---'}</span> • ${c.event_type || 'Disruption'}
            </div>
        `;
        list.appendChild(item);
    });
    lucide.createIcons();
}

/* ===========================================================
 *  MOCK GENERATOR & DEMO SIMULATION
 * =========================================================*/
window.mockDatabaseClaim = async function() {
    const citySelect = document.getElementById('city-select');
    const currentCity = citySelect ? citySelect.value : 'Delhi NCR';
    const cityNames = CITY_ZONES[currentCity] || CITY_ZONES['Delhi NCR'];
    
    showToast(`Generating mock DB claim for ${currentCity}...`, 'info');
    
    // Pick a random zone
    const randIdx = Math.floor(Math.random() * cityNames.length);
    const zoneName = cityNames[randIdx];
    
    const randomID = Math.floor(Math.random() * 9000) + 1000;
    const riderEmail = `mock_${randomID}@gigshield.demo`;
    
    // Random amount
    const amtNum = Math.floor(Math.random() * 50) * 100 + 2000;
    const amountStr = `₹${amtNum.toLocaleString('en-IN')}`;
    
    spikeWeatherStats();
    await Store.createClaim(riderEmail, 'Severe Disruption', amountStr, zoneName);
    
    window.dispatchEvent(new Event('storage'));
    showToast(`🚨 Mock claim added in ${zoneName}!`, 'alert');
};

// --- FAKE VISUAL SIMULATION (Legacy Demo) ---
let simulationInProgress = false;

window.playFakeSimulation = function() {
    if (simulationInProgress) return;
    simulationInProgress = true;
    
    // Clear current live synced view but don't delete DB records
    clearZones();

    const citySelect = document.getElementById('city-select');
    const currentCity = citySelect ? citySelect.value : 'Delhi NCR';
    const cityNames = CITY_ZONES[currentCity] || CITY_ZONES['Delhi NCR'];

    const alertZones = [];
    const numAlerts = Math.floor(Math.random() * 3) + 3; // 3 to 5
    while(alertZones.length < numAlerts) {
        let rand = Math.floor(Math.random() * cityNames.length);
        if(!alertZones.includes(rand)) alertZones.push(rand);
    }

    const riderCount = Math.floor(Math.random() * 300) + 600;
    const eligibleCount = riderCount - Math.floor(Math.random() * 100);

    // Phase 1 (0s)
    alertZones.forEach(idx => {
        const zone = document.getElementById(`zone-${idx}`);
        if (zone) zone.classList.add('alert');
    });
    spikeWeatherStats();

    const list = document.getElementById('alertList');
    if (!list) return;

    list.innerHTML = '';
    alertZones.forEach(idx => {
        const item = document.createElement('div');
        item.className = 'p-3 mb-2 bg-rose-500/10 border border-rose-500/20 rounded-lg';
        item.innerHTML = `
            <div class="flex justify-between items-center font-bold text-xs text-rose-500">
                <span class="truncate pr-2">${cityNames[idx]}</span><span class="shrink-0 flex items-center"><span class="w-2 h-2 bg-rose-500 rounded-full mr-1.5 animate-pulse"></span> Mock Demo</span>
            </div>
            <div class="text-[10px] text-gray-500 mt-1">Simulated Disruption • ${Math.floor(riderCount/alertZones.length)} riders affected</div>
        `;
        list.appendChild(item);
    });
    const alertCountEl = document.getElementById('alertCount');
    if (alertCountEl) alertCountEl.innerText = `Fake Demo`;
    showToast(`🚨 Playing Visual Simulation Demo...`, 'alert');

    // Phase 2 (2.5s)
    setTimeout(() => {
        showToast(`✓ AI verification running on simulated claims...`, 'info');
        list.querySelectorAll('div > div:first-child').forEach(el => {
            el.innerHTML = el.innerHTML.replace('Mock Demo', 'Checking...');
            el.classList.replace('text-rose-500', 'text-amber-500');
        });
    }, 2500);

    // Phase 3 (5s)
    setTimeout(() => {
        showToast(`✅ Simulation complete. Payouts processed.`, 'success');
        alertZones.forEach(idx => {
            const zone = document.getElementById(`zone-${idx}`);
            if (zone) {
                zone.classList.remove('alert');
                zone.classList.add('payout-complete');
            }
        });

        list.innerHTML = '';
        alertZones.forEach(idx => {
            const item = document.createElement('div');
            item.className = 'p-3 mb-2 bg-teal-500/10 border border-teal-500/20 rounded-lg';
            item.innerHTML = `
                <div class="flex justify-between items-center font-bold text-xs text-teal-400">
                    <span class="truncate pr-2">${cityNames[idx]}</span>
                    <span class="flex items-center shrink-0"><i data-lucide="check-circle" class="w-3 h-3 mr-1"></i> Demo Paid</span>
                </div>
                <div class="text-[10px] text-gray-500 mt-1">${Math.floor(eligibleCount/alertZones.length)} mock riders paid</div>
            `;
            list.appendChild(item);
        });

        lucide.createIcons();
        simulationInProgress = false;
        
        // Return to DB view after 6 seconds
        setTimeout(() => {
            if (!simulationInProgress) syncLiveMap();
        }, 6000);
    }, 5000);
};

/* ===========================================================
 *  CLEAR / RESET
 * =========================================================*/
window.clearZones = function() {
    document.querySelectorAll('.zone-pill').forEach(z => {
        z.classList.remove('alert', 'payout-complete');
    });
};

window.clearMap = function() {
    clearZones();
    // Just local visual clear, doesn't actually wipe the DB
    const list = document.getElementById('alertList');
    if (list) list.innerHTML = '<p class="text-xs text-gray-600 text-center mt-20">Map cleared visually.</p>';
    const alertCountEl = document.getElementById('alertCount');
    if (alertCountEl) alertCountEl.innerText = '0 active';
    const toastCont = document.getElementById('toast-container');
    if (toastCont) toastCont.innerHTML = '';
    
    const citySelect = document.getElementById('city-select');
    if(citySelect) fetchLiveWeather(citySelect.value);
};

/* ===========================================================
 *  SIGN OUT + CROSS-TAB SYNC
 * =========================================================*/
const sidebarSignout = document.getElementById('sidebar-signout');
const profileLogout = document.getElementById('logout-btn');
if (sidebarSignout) sidebarSignout.addEventListener('click', () => Store.logout());
if (profileLogout) profileLogout.addEventListener('click', () => Store.logout());

window.addEventListener('storage', (e) => {
    if (e.key === 'gigshield_claims' || !e.key) {
        if (typeof window.updateNotifications === 'function') window.updateNotifications();
        if (typeof window.syncLiveMap === 'function') window.syncLiveMap();
    }
});
