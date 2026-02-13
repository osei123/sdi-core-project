import { supabase } from './supabase.js';

export function renderLogin(container, onLoginSuccess) {
    container.innerHTML = `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-logo">
          <div class="logo-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1>SDI Admin</h1>
          <p class="login-subtitle">Safety & Quality Management</p>
        </div>
        <form id="login-form" autocomplete="on">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" placeholder="admin@company.com" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="Enter your password" required autocomplete="current-password" />
          </div>
          <div id="login-error" class="login-error hidden"></div>
          <button type="submit" id="login-btn" class="btn-primary btn-full">
            <span class="btn-text">Sign In</span>
            <span class="btn-loader hidden">
              <span class="spinner"></span>
            </span>
          </button>
        </form>
      </div>
    </div>
  `;

    const form = document.getElementById('login-form');
    const errorEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        errorEl.classList.add('hidden');
        btn.querySelector('.btn-text').textContent = 'Signing in...';
        btn.querySelector('.btn-loader').classList.remove('hidden');
        btn.disabled = true;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            // Check role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, full_name')
                .eq('id', data.user.id)
                .single();

            if (profileError) throw new Error('Profile not found.');

            if (profile.role !== 'manager') {
                await supabase.auth.signOut();
                throw new Error('Access denied. Manager role required.');
            }

            onLoginSuccess(data.user, profile);
        } catch (err) {
            errorEl.textContent = err.message;
            errorEl.classList.remove('hidden');
            btn.querySelector('.btn-text').textContent = 'Sign In';
            btn.querySelector('.btn-loader').classList.add('hidden');
            btn.disabled = false;
        }
    });
}

export async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single();

    if (!profile || profile.role !== 'manager') return null;

    return { user: session.user, profile };
}

export async function logout() {
    await supabase.auth.signOut();
}
