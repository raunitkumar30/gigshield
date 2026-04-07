// Initialize Icons
lucide.createIcons();

// --- AUTO-REDIRECT IF ALREADY LOGGED IN ---
(function () {
    const session = Store.peekSession();
    if (session.email && session.role) {
        if (session.role === 'admin') {
            window.location.replace('admin_dashboard.html');
        } else if (session.role === 'rider') {
            window.location.replace('rider_dashboard.html');
        }
    }
})();
