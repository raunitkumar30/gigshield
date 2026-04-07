/**
 * ============================================================
 *  GigShield — Supabase State Management (store.js)
 * ============================================================
 */

const Store = (() => {
    // Environment setup: Securely pull from window.env or fallback
    const config = window.env || {};
    const SUPABASE_URL = config.SUPABASE_URL || 'YOUR_SUPABASE_URL'; 
    const SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
    
    let supabase = null;
    if (!window.supabase) {
        console.error('Database Initialization Failed: Supabase client library not loaded.');
    } else if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY' || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('Database Initialization Failed: Missing or placeholder API keys (SUPABASE_URL / SUPABASE_ANON_KEY).');
    } else {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (err) {
            console.error('Failed to create Supabase client:', err);
        }
    }

    /* ========================================================
     *  RIDER CRUD  (Supabase DB)
     * ======================================================*/
    async function getRiders() {
        if (!supabase) return [];
        const { data, error } = await supabase.from('riders').select('*');
        if (error) console.error(error);
        return data || [];
    }

    async function saveRider(rider) {
        if (!supabase) return { ok: false, error: 'Service Unavailable' };
        try {
            const email = rider.email.trim().toLowerCase();

            const { data: existing, error: existingError } = await supabase.from('riders').select('email').eq('email', email).single();
            if (existingError && existingError.code !== 'PGRST116') {
                console.error('DB error checking email:', existingError);
                return { ok: false, error: 'Service Unavailable' };
            }
            if (existing) return { ok: false, error: 'Email is already registered.' };

            const payload = {
                email: email,
                name: rider.name.trim(),
                password: rider.password,
                phone: rider.phone.trim(),
                onboarded: false
            };

            const { error } = await supabase.from('riders').insert([payload]);
            if (error) {
                console.error('DB error saving rider:', error);
                return { ok: false, error: 'Service Unavailable' };
            }
            return { ok: true };
        } catch (err) {
            console.error('Exception in saveRider:', err);
            return { ok: false, error: 'Service Unavailable' };
        }
    }

    async function findRider(email) {
        if (!supabase || !email) return null;
        const { data } = await supabase.from('riders').select('*').eq('email', email.trim().toLowerCase()).single();
        return data;
    }

    async function findRiderByCredentials(email, password) {
        if (!supabase) return { error: 'Service Unavailable' };
        if (!email || !password) return null;
        try {
            const { data, error } = await supabase.from('riders')
                .select('*')
                .eq('email', email.trim().toLowerCase())
                .eq('password', password)
                .single();
                
            if (error) {
                console.error('Error finding rider by credentials:', error);
                if (error.code !== 'PGRST116') {
                    return { error: 'Service Unavailable' };
                }
                return null;
            }
            return data || null;
        } catch (err) {
            console.error('Exception in findRiderByCredentials:', err);
            return { error: 'Service Unavailable' };
        }
    }

    async function updateRider(email, updates) {
        if (!supabase || !email) return null;
        const { data } = await supabase.from('riders')
            .update(updates)
            .eq('email', email.trim().toLowerCase())
            .select()
            .single();
        return data;
    }

    /* ========================================================
     *  CLAIMS & PAYOUTS CRUD  (Supabase DB)
     * ======================================================*/
    async function getClaims() {
        if (!supabase) return [];
        const { data } = await supabase.from('claims').select('*').order('created_at', { ascending: false });
        return data || [];
    }

    async function getPayouts() {
        if (!supabase) return [];
        const { data } = await supabase.from('payouts').select('*').order('created_at', { ascending: false });
        return data || [];
    }

    async function getClaimsByEmail(email) {
        if (!supabase || !email) return [];
        const { data } = await supabase.from('claims').select('*').eq('rider_email', email.trim().toLowerCase()).order('created_at', { ascending: false });
        return data || [];
    }

    async function updateClaimStatus(id, newStatus) {
        if (!supabase) return false;
        const { error } = await supabase.from('claims')
            .update({ status: newStatus })
            .eq('id', id);
        return !error;
    }

    async function createClaim(riderEmail, eventName, amount, explicitZone = null) {
        if (!supabase) return null;
        const rider = await findRider(riderEmail) || {};
        const payload = {
            rider_email: riderEmail.trim().toLowerCase(),
            zone: explicitZone || rider.zone || 'Unknown Zone',
            event_type: eventName,
            amount: amount,
            status: 'In Review'
        };

        const { data, error } = await supabase.from('claims').insert([payload]).select().single();
        if (error) {
            console.error(error);
            return null;
        }
        return data;
    }

    /* ========================================================
     *  REALTIME SYNC (Supabase WebSockets)
     * ======================================================*/
    if (supabase) {
        supabase
          .channel('schema-db-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'claims' }, (payload) => {
              console.log('Realtime Update - Claim:', payload);
              
              // Trigger any UI refresh functions that exist on the global window
              if (typeof window.updateNotifications === 'function') window.updateNotifications();
              if (typeof window.updateDashboardStats === 'function') window.updateDashboardStats();
              if (typeof window.renderActiveClaims === 'function') window.renderActiveClaims(); 
              
              // Maintain legacy bridge
              window.dispatchEvent(new Event('storage')); 
          })
          .subscribe();
    }

    /* ========================================================
     *  SESSION MANAGEMENT
     * ======================================================*/
    const SESSION_EMAIL = 'session_user_email';
    const SESSION_ROLE  = 'session_role';
    const ADMIN_EMAIL    = 'admin@gigshield.in';
    const ADMIN_PASSWORD = 'admin123';

    function loginAdmin() {
        sessionStorage.setItem(SESSION_EMAIL, ADMIN_EMAIL);
        sessionStorage.setItem(SESSION_ROLE,  'admin');
    }

    function loginRider(rider) {
        if (!rider || !rider.email) return false;
        sessionStorage.setItem(SESSION_EMAIL, rider.email.trim().toLowerCase());
        sessionStorage.setItem(SESSION_ROLE,  'rider');
        return true;
    }

    function getSession() {
        return {
            email: sessionStorage.getItem(SESSION_EMAIL),
            role:  sessionStorage.getItem(SESSION_ROLE)
        };
    }

    function logout() {
        sessionStorage.removeItem(SESSION_EMAIL);
        sessionStorage.removeItem(SESSION_ROLE);
        window.location.href = 'index.html';
    }

    function requireAuth(requiredRole) {
        const { email, role } = getSession();
        if (!email || !role || role !== requiredRole) {
            window.location.replace('index.html');
            return false;
        }
        return true;
    }

    async function getCurrentRider() {
        const { email } = getSession();
        if (!email) return null;
        return await findRider(email);
    }

    function isValidAdmin(email, password) {
        return (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD);
    }

    function peekSession() {
        return getSession();
    }

    return Object.freeze({
        getRiders,
        saveRider,
        findRider,
        findRiderByCredentials,
        updateRider,
        getClaims,
        getPayouts,
        getClaimsByEmail,
        updateClaimStatus,
        createClaim,
        loginAdmin,
        loginRider,
        getSession,
        logout,
        requireAuth,
        getCurrentRider,
        isValidAdmin,
        peekSession
    });
})();
