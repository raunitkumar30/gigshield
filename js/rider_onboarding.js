Store.requireAuth('rider');

lucide.createIcons();

// ---- State ----
let selectedPlan = 'Standard';
let selectedPrice = 99;

// ---- Pre-fill KYC name from the rider's registration ----
document.addEventListener('DOMContentLoaded', async () => {
    const currentRider = await Store.getCurrentRider();
    if (currentRider && currentRider.name) {
        const kycNameInput = document.getElementById('kyc-name');
        if (kycNameInput) kycNameInput.value = currentRider.name;
    }

    // Build mock map grid (6×6 = 36 cells)
    const mapGrid = document.getElementById('zone-map-grid');
    if (mapGrid) {
        for (let i = 0; i < 36; i++) {
            const cell = document.createElement('div');
            cell.className = 'map-cell';
            cell.id = `map-cell-${i}`;
            mapGrid.appendChild(cell);
        }
    }
});

/* ===========================================================
 *  STEP 0 — PHONE / OTP VERIFICATION
 * =========================================================*/
window.sendOTP = function() {
    const phoneInput = document.getElementById('phone-input');
    if (!phoneInput) return;
    const phone = phoneInput.value.trim();
    if (phone.length < 10) {
        phoneInput.focus();
        return;
    }

    // Disable button, show OTP section
    const btn = document.getElementById('send-otp-btn');
    if (btn) {
        btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px"></div>';
        btn.disabled = true;
    }

    setTimeout(() => {
        const phoneForm = document.getElementById('phone-form');
        const otpSection = document.getElementById('otp-section');
        if (phoneForm) phoneForm.classList.add('hidden');
        if (otpSection) otpSection.classList.remove('hidden');
        lucide.createIcons();

        // Auto-fill OTP digits after 2 seconds
        setTimeout(() => {
            const digits = '123456';
            const boxes = document.querySelectorAll('.otp-box');
            let idx = 0;

            const fillInterval = setInterval(() => {
                if (idx >= 6) {
                    clearInterval(fillInterval);
                    // OTP complete — show verified
                    const otpWaiting = document.getElementById('otp-waiting');
                    const otpVerified = document.getElementById('otp-verified');
                    const otpContinueBtn = document.getElementById('otp-continue-btn');
                    if (otpWaiting) otpWaiting.classList.add('hidden');
                    if (otpVerified) otpVerified.classList.remove('hidden');
                    if (otpContinueBtn) otpContinueBtn.disabled = false;
                    lucide.createIcons();
                    return;
                }
                boxes[idx].value = digits[idx];
                boxes[idx].classList.add('filled');
                idx++;
            }, 150);
        }, 2000);
    }, 800);
};

/* ===========================================================
 *  STEP 1 — KYC VERIFICATION  (1.5s simulated spinner)
 * =========================================================*/
window.verifyKYC = function() {
    const nameVal = document.getElementById('kyc-name').value.trim();
    const aadhaarVal = document.getElementById('kyc-aadhaar').value.trim();
    const platformVal = document.getElementById('kyc-platform').value;

    if (!nameVal || !aadhaarVal || !platformVal) {
        return; // native validation handles empty fields
    }

    // Hide form, show spinner
    document.getElementById('kyc-form').classList.add('hidden');
    document.getElementById('kyc-loading').classList.remove('hidden');

    // Simulate 1.5-second verification delay
    setTimeout(() => {
        document.getElementById('kyc-loading').classList.add('hidden');
        document.getElementById('kyc-verified').classList.remove('hidden');
        document.getElementById('kyc-verified-name').textContent = nameVal;
        document.getElementById('kyc-verified-platform').textContent = platformVal + ' Rider';
        lucide.createIcons();
    }, 1500);
};

/* ===========================================================
 *  STEP 2 — ZONE DETECTION  (Mock Map + GPS)
 * =========================================================*/
window.simulateZoneDetection = function() {
    // Reset state
    document.getElementById('zone-detecting').classList.remove('hidden');
    document.getElementById('zone-result').classList.add('hidden');
    document.getElementById('gps-overlay').classList.remove('hidden');
    document.getElementById('zone-label-overlay').classList.add('hidden');

    // Reset all map cells
    document.querySelectorAll('.map-cell').forEach(c => {
        c.classList.remove('highlight', 'locked');
    });

    // Phase 1: Highlight cells outward from center (scanning effect)
    const centerCells = [14, 15, 20, 21]; // center of 6x6 grid
    const ring1 = [8, 9, 10, 13, 16, 19, 22, 25, 26, 27];
    const ring2 = [0, 1, 2, 3, 4, 5, 6, 7, 11, 12, 17, 18, 23, 24, 28, 29, 30, 31, 32, 33, 34, 35];

    setTimeout(() => {
        centerCells.forEach(i => {
            const cell = document.getElementById(`map-cell-${i}`);
            if (cell) cell.classList.add('highlight');
        });
    }, 400);

    setTimeout(() => {
        ring1.forEach(i => {
            const cell = document.getElementById(`map-cell-${i}`);
            if (cell) cell.classList.add('highlight');
        });
    }, 800);

    setTimeout(() => {
        ring2.forEach(i => {
            const cell = document.getElementById(`map-cell-${i}`);
            if (cell) cell.classList.add('highlight');
        });
    }, 1200);

    // Phase 2: Lock in zone
    setTimeout(() => {
        // Remove all highlights, lock center cells
        document.querySelectorAll('.map-cell').forEach(c => c.classList.remove('highlight'));
        centerCells.forEach(i => {
            const cell = document.getElementById(`map-cell-${i}`);
            if (cell) cell.classList.add('locked');
        });

        // Hide GPS dot, show zone label
        document.getElementById('gps-overlay').classList.add('hidden');
        document.getElementById('zone-label-overlay').classList.remove('hidden');

        // Hide detecting spinner, show result
        document.getElementById('zone-detecting').classList.add('hidden');
        document.getElementById('zone-result').classList.remove('hidden');
        lucide.createIcons();
    }, 2200);
};

/* ===========================================================
 *  STEP 3 — PLAN SELECTION
 * =========================================================*/
window.selectPlan = function(name, price) {
    selectedPlan = name;
    selectedPrice = price;

    document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('active'));
    const planCard = document.getElementById(`plan-${name}`);
    if (planCard) planCard.classList.add('active');
    
    const planNameDisplay = document.getElementById('selected-plan-name');
    if (planNameDisplay) planNameDisplay.innerText = name;
    
    const successPlanTitle = document.getElementById('success-plan-title');
    if (successPlanTitle) successPlanTitle.innerText = `${name} Plan — Active`;
};

/* ===========================================================
 *  STEP 4 — UPI AUTOPAY  (1s simulated spinner)
 * =========================================================*/
window.activateAutoPay = function() {
    const upiInput = document.getElementById('upi-input');
    if (!upiInput) return;
    const upiVal = upiInput.value.trim();
    if (!upiVal) {
        upiInput.focus();
        return;
    }

    // Hide form, show spinner
    document.getElementById('upi-form').classList.add('hidden');
    document.getElementById('upi-loading').classList.remove('hidden');

    // Simulate 1-second linking
    setTimeout(async () => {
        // Update rider record in Supabase
        const session = Store.getSession();
        await Store.updateRider(session.email, {
            plan: selectedPlan,
            zone: 'Sector 18, Noida',
            upi_id: upiVal,
            onboarded: true
        });

        // Show success screen
        document.getElementById('step-4').classList.add('hidden');
        document.getElementById('success-upi-display').textContent = `UPI: ${upiVal}`;
        document.getElementById('step-success').classList.remove('hidden');

        // Hide stepper
        document.getElementById('stepper').classList.add('hidden');

        lucide.createIcons();
    }, 1000);
};

/* ===========================================================
 *  STEP NAVIGATION
 * =========================================================*/
window.goToStep = function(step) {
    // Hide all step panels
    for (let i = 0; i <= 4; i++) {
        const stepPanel = document.getElementById(`step-${i}`);
        if (stepPanel) stepPanel.classList.add('hidden');
    }

    // Show target step
    const targetStepPanel = document.getElementById(`step-${step}`);
    if (targetStepPanel) targetStepPanel.classList.remove('hidden');

    // Trigger zone detection animation when entering step 2
    if (step === 2) simulateZoneDetection();

    // Update progress circles
    for (let i = 0; i <= 4; i++) {
        const dot = document.getElementById(`dot-${i}`);
        const label = document.getElementById(`text-${i}`);
        if (!dot || !label) continue;

        if (i < step) {
            dot.className = 'step-circle step-done';
            dot.innerHTML = '<i data-lucide="check" class="w-3 h-3 text-black"></i>';
            label.className = 'text-[10px] uppercase font-bold tracking-widest text-teal-500';
        } else if (i === step) {
            dot.className = 'step-circle step-active';
            dot.innerHTML = i + 1;
            label.className = 'text-[10px] uppercase font-bold tracking-widest text-teal-500';
        } else {
            dot.className = 'step-circle';
            dot.innerHTML = i + 1;
            label.className = 'text-[10px] uppercase font-bold tracking-widest text-gray-600';
        }
    }

    lucide.createIcons();
};

/* ===========================================================
 *  COMPLETE — GO TO DASHBOARD
 * =========================================================*/
window.goToDashboard = function() {
    window.location.href = 'rider_dashboard.html';
};
