lucide.createIcons();

// ---- Toggle Views ----
window.showSignup = function() {
    const loginView = document.getElementById('view-login');
    const signupView = document.getElementById('view-signup');
    if (loginView) loginView.classList.add('hidden');
    if (signupView) signupView.classList.remove('hidden');
    clearBanners();
};

window.showLogin = function() {
    const loginView = document.getElementById('view-login');
    const signupView = document.getElementById('view-signup');
    if (signupView) signupView.classList.add('hidden');
    if (loginView) loginView.classList.remove('hidden');
    clearBanners();
};

window.clearBanners = function() {
    document.querySelectorAll('.error-banner, .success-banner').forEach(b => b.classList.remove('show'));
};

// ---- SIGN UP LOGIC ----
const signupForm = document.getElementById('form-signup');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearBanners();

        const nameInput = document.getElementById('signup-name');
        const phoneInput = document.getElementById('signup-phone');
        const emailInput = document.getElementById('signup-email');
        const passwordInput = document.getElementById('signup-password');
        const signupBtn = document.getElementById('signup-btn');
        const signupError = document.getElementById('signup-error');
        const signupErrorText = document.getElementById('signup-error-text');
        const signupSuccess = document.getElementById('signup-success');

        if (!nameInput || !phoneInput || !emailInput || !passwordInput || !signupBtn) return;

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        const result = await Store.saveRider({ name, phone, email, password });

        if (!result.ok) {
            if (signupErrorText) signupErrorText.textContent = result.error;
            if (signupError) signupError.classList.add('show');
            lucide.createIcons();
            return;
        }

        // Login the freshly registered rider immediately
        Store.loginRider({ email });

        // Show success, then redirect to onboarding
        signupBtn.innerHTML = 'Creating account...';
        signupBtn.style.opacity = '0.7';
        signupBtn.disabled = true;
        if (signupSuccess) signupSuccess.classList.add('show');
        lucide.createIcons();

        setTimeout(() => {
            window.location.href = 'rider_onboarding.html';
        }, 1000);
    });
}

// ---- LOGIN LOGIC ----
const loginForm = document.getElementById('form-login');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearBanners();

        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const loginBtn = document.getElementById('login-btn');
        const loginError = document.getElementById('login-error');
        const loginErrorText = document.getElementById('login-error-text');

        if (!emailInput || !passwordInput || !loginBtn) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        const rider = await Store.findRiderByCredentials(email, password);

        if (!rider || rider.error) {
            if (loginErrorText) loginErrorText.textContent = (rider && rider.error) ? rider.error : 'Invalid Email or Password. Please try again.';
            if (loginError) loginError.classList.add('show');
            lucide.createIcons();
            return;
        }

        // Save session
        Store.loginRider(rider);

        loginBtn.innerHTML = 'Logging in...';
        loginBtn.style.opacity = '0.7';
        loginBtn.disabled = true;

        setTimeout(() => {
            // Route based on onboarding status
            if (rider.onboarded) {
                window.location.href = 'rider_dashboard.html';
            } else {
                window.location.href = 'rider_onboarding.html';
            }
        }, 800);
    });
}
