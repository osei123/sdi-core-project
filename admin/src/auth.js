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
          <div style="text-align: right; margin-bottom: 15px;">
            <a href="#" id="forgot-link" style="color: #6366f1; font-size: 0.9em; text-decoration: none;">Forgot Password?</a>
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

  document.getElementById('forgot-link').addEventListener('click', (e) => {
    e.preventDefault();
    renderForgotPassword(container, () => renderLogin(container, onLoginSuccess));
  });

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
        .select('role, full_name, username')
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
    .select('role, full_name, username')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'manager') return null;

  return { user: session.user, profile };
}

// --- NEW AUTH VIEWS ---

export function renderForgotPassword(container, onBack) {
  container.innerHTML = `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-logo">
           <div class="logo-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1>Reset Password</h1>
          <p class="login-subtitle">Enter your email to receive instructions</p>
        </div>
        <form id="forgot-form">
          <div class="form-group">
            <label for="reset-email">Email Address</label>
            <input type="email" id="reset-email" placeholder="name@company.com" required />
          </div>
          <div id="reset-message" class="login-error hidden" style="background-color: #d1fae5; color: #065f46; border-color: #a7f3d0;"></div>
          <div id="reset-error" class="login-error hidden"></div>
          
          <button type="submit" id="reset-btn" class="btn-primary btn-full">Send Reset Link</button>
          <button type="button" id="back-btn" class="btn-ghost btn-full" style="margin-top: 10px;">Back to Login</button>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById('forgot-form');
  const msgEl = document.getElementById('reset-message');
  const errorEl = document.getElementById('reset-error');

  // Back button
  document.getElementById('back-btn').addEventListener('click', onBack);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value.trim();
    const btn = document.getElementById('reset-btn');

    msgEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      if (error) throw error;

      msgEl.textContent = 'Check your email for the password reset link.';
      msgEl.classList.remove('hidden');
      form.reset();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Reset Link';
    }
  });
}

export function renderUpdatePassword(container, onSuccess) {
  container.innerHTML = `
    <div class="login-wrapper">
      <div class="login-card">
         <div class="login-logo">
           <div class="logo-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1>Update Password</h1>
          <p class="login-subtitle">Create a new secure password</p>
        </div>
        <form id="update-pass-form">
          <div class="form-group">
            <label for="new-password">New Password</label>
            <input type="password" id="new-password" placeholder="New password" required minlength="6" />
          </div>
          <div class="form-group">
            <label for="confirm-password">Confirm Password</label>
            <input type="password" id="confirm-password" placeholder="Confirm new password" required minlength="6" />
          </div>
          <div id="update-error" class="login-error hidden"></div>
          <button type="submit" id="update-btn" class="btn-primary btn-full">Update Password</button>
        </form>
      </div>
    </div>
    `;

  const form = document.getElementById('update-pass-form');
  const errorEl = document.getElementById('update-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    const btn = document.getElementById('update-btn');

    if (newPass !== confirmPass) {
      errorEl.textContent = 'Passwords do not match.';
      errorEl.classList.remove('hidden');
      return;
    }

    errorEl.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Updating...';

    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;

      alert('Password updated successfully! Redirecting to login...');
      if (onSuccess) onSuccess();
      else window.location.hash = ''; // Clear hash
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
      btn.disabled = false;
    } finally {
      btn.textContent = 'Update Password';
    }
  });
}

export function renderRecoveryMessage(container, message = "Email Verified Successfully.") {
  container.innerHTML = `
    <div class="login-wrapper">
      <div class="login-card" style="text-align: center;">
        <div class="login-logo">
           <div class="logo-icon" style="color: #10b981;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h1>Success</h1>
          <p class="login-subtitle" style="font-size: 1.1rem; color: #10b981;">${message}</p>
          <p style="margin-top: 20px; color: #6b7280;">You can now close this window and log in to the mobile app.</p>
        </div>
      </div>
    </div>
    `;
}

export async function logout() {
  await supabase.auth.signOut();
}

