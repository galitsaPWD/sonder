// Unified Login Logic
document.addEventListener('DOMContentLoaded', () => {
    initializePasswordToggle();
    initializeForm();
});

// === PASSWORD TOGGLE ===
function initializePasswordToggle() {
    const toggle = document.getElementById('passwordToggle');
    const input = document.getElementById('password');
    
    if (toggle && input) {
        toggle.addEventListener('click', () => {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            toggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
            toggle.innerHTML = isPassword ? 
                `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 9C1 9 4 3 9 3C14 3 17 9 17 9C17 9 14 15 9 15C4 15 1 9 1 9Z" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="9" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>` :
                `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M17.94 17.94L0.0600586 0.0600586" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8.5 3C11.66 3 14.33 4.3 16 6.5C16.8 7.55 17.5 9 17.5 9C17.5 9 16 12 11.5 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M2 6.5C3 5 5 3.5 7 3.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M1.5 9C1.5 9 3.5 14 8.5 14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="10" r="2" stroke="currentColor" stroke-width="1.5"/></svg>`;
        });
    }
}

// === FORM HANDLING ===
function initializeForm() {
    const form = document.getElementById('loginForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin();
    });
}

// === NOTIFICATION SYSTEM ===
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 
        '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#E8F5E9"/><path d="M6 10L9 13L14 8" stroke="#2E7D32" stroke-width="2" stroke-linecap="round"/></svg>' :
        '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#FFEBEE"/><path d="M10 6V10" stroke="#C62828" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="14" r="1" fill="#C62828"/></svg>';

    notification.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);

    // Remove after 3s
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// === LOGIN LOGIC (SUPABASE AUTH) ===
async function handleLogin() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const button = document.querySelector('.submit-btn'); // Assuming class 'submit-btn'
    const originalText = button.innerHTML;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    try {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

        // 1. Authenticate with Supabase
        const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;
        if (!user) throw new Error("Login failed. No user returned.");

        // 2. Fetch User Profile & Role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, first_name, last_name')
            .eq('id', user.id)
            .single();

        // 2a. ADMIN FALLBACK (For first-time setup only)
        // If profile doesn't exist but login worked, and it's the specific admin email, create it.
        // SECURITY NOTE: In production, remove this or secure it.
        /* 
        if (profileError && profileError.code === 'PGRST116') {
             // Handle missing profile logic here if needed, or error out.
             console.warn("Profile not found. If this is the master admin, please insert profile manually or run setup.");
        }
        */

        if (profileError || !profile) {
            console.error('Profile fetch error:', profileError);
            throw new Error('User profile not found. Contact administrator.');
        }

        // 3. Store Role for Session (Optional, mostly relied on token)
        sessionStorage.setItem('userRole', profile.role);
        
        // 4. Redirect based on Role
        // 4. Redirect based on Role
        switch(profile.role) {
            case 'admin':
                showNotification(`Welcome back, ${profile.first_name || 'Admin'}!`, 'success');
                setTimeout(() => window.location.href = 'admin/dashboard.html', 800);
                break;
            case 'cashier':
                showNotification(`Welcome back, ${profile.first_name || 'Cashier'}!`, 'success');
                setTimeout(() => window.location.href = 'cashier/collections.html', 800);
                break;
            case 'reader':
                // Reader PWA is at ../webapp/index.html, but user requested error notification on this portal
                showNotification('Access Denied. Readers must use the Mobile App / Web App.', 'error');
                await supabase.auth.signOut();
                button.disabled = false;
                button.innerHTML = originalText;
                return; // Stop execution
            default:
                showNotification('Unknown role. Access denied.', 'error');
                await supabase.auth.signOut();
                button.disabled = false;
                button.innerHTML = originalText;
        }

    } catch (error) {
        console.error('Login Error:', error);
        showNotification(error.message || 'Invalid email or password', 'error');
        button.disabled = false;
        button.innerHTML = originalText;
    }
}
