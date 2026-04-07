// Initialize Lucide icons
lucide.createIcons();

// Toggle password visibility
const pwInput = document.getElementById('password');
const togglePwBtn = document.getElementById('toggle-pw');

if (togglePwBtn && pwInput) {
    togglePwBtn.addEventListener('click', () => {
        const isHidden = pwInput.type === 'password';
        pwInput.type = isHidden ? 'text' : 'password';
    });
}

// Handle Form Submission
const adminForm = document.getElementById('admin-form');
if (adminForm) {
    adminForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const submitBtn = document.getElementById('submit-btn');
        const errorBanner = document.getElementById('error-banner');
        const errorText = document.getElementById('error-text');

        if (!emailInput || !passwordInput || !submitBtn || !errorBanner || !errorText) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Hide any previous error
        errorBanner.classList.remove('show');

        if (Store.isValidAdmin(email, password)) {
            // Success — save session and redirect
            submitBtn.innerHTML = 'Signing in...';
            submitBtn.style.opacity = '0.7';
            submitBtn.disabled = true;

            Store.loginAdmin();

            setTimeout(() => {
                window.location.href = 'admin_dashboard.html';
            }, 800);
        } else {
            // Show inline error instead of alert()
            errorBanner.classList.add('show');
            errorText.textContent = 'Access Denied — Invalid credentials';
            lucide.createIcons();
        }
    });
}
