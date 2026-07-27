document.addEventListener('DOMContentLoaded', () => {
  const kabinetContent = document.getElementById('kabinet-content');
  const toastContainer = document.getElementById('toast-container');
  let currentView = 'login'; // 'login', 'register', 'dashboard'

  // Config kontrolü
  function checkConfig() {
    if (typeof window.SUPABASE_URL === 'undefined' || !window.SUPABASE_URL || window.SUPABASE_URL.includes('BURAYA_SUPABASE_PROJECT_URL')) {
      kabinetContent.innerHTML = `
        <div class="auth-card" style="text-align: center;">
          <svg viewBox="0 0 24 24" style="width: 48px; height: 48px; fill: var(--accent-gold); margin-bottom: 1rem;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          <h2 style="font-family: 'Playfair Display', serif; margin-bottom: 0.5rem; color: var(--bg-dark);">Supabase Kurulumu Gerekli</h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem;">
            Müştəri kabinetinin işləməsi üçün ilk öncə <strong>config.js</strong> faylına Supabase məlumatlarınızı daxil etməlisiniz.
          </p>
        </div>
      `;
      return false;
    }
    return true;
  }

  // Oturum Durumunu Kontrol Et
  async function initKabinet() {
    if (!checkConfig()) return;

    try {
      const { data: { session }, error } = await window.supabaseClient.auth.getSession();
      if (error) throw error;

      if (session) {
        // Giriş yapılmışsa kullanıcı profil bilgilerini ve rolünü çek
        const user = session.user;
        let role = 'user';

        // Profiles tablosundan rolü oku
        const { data: profile, error: profileError } = await window.supabaseClient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profil çekme hatası:', profileError);
        }

        if (profile) {
          role = profile.role;
        } else {
          // Eğer profil kaydı yoksa otomatik oluştur (Geriye dönük uyumluluk)
          try {
            await window.supabaseClient
              .from('profiles')
              .insert([{ id: user.id, email: user.email, role: 'user' }]);
          } catch (insertErr) {
            console.error('Profil oluşturulamadı:', insertErr);
          }
        }

        showDashboard(user, role);
      } else {
        // Giriş yapılmamışsa login ekranını göster
        showLogin();
      }
    } catch (err) {
      console.error('Kabinet başlatılamadı:', err);
      showToast('Oturum bilgileri doğrulanırken hata oluştu.', 'error');
    }
  }

  // 1. Giriş Yapma Ekranını Göster
  function showLogin() {
    currentView = 'login';
    kabinetContent.innerHTML = `
      <div class="auth-card">
        <div class="auth-header">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
          <h2>Müştəri Kabineti</h2>
          <p>Sifarişlərinizi izləmək və idarə etmək üçün daxil olun.</p>
        </div>

        <form id="auth-login-form">
          <div class="form-group">
            <label for="login-email">E-poçt Ünvanı *</label>
            <input type="email" id="login-email" required placeholder="nümunə@mail.com">
          </div>
          <div class="form-group">
            <label for="login-password">Parol *</label>
            <input type="password" id="login-password" required placeholder="••••••••">
          </div>
          <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">Daxil Ol</button>
        </form>

        <div class="auth-divider"><span>və ya</span></div>
        
        <a href="#" id="link-to-register" class="auth-toggle-link">Yeni hesab yarat</a>
        <a href="index.html" style="display: block; text-align: center; margin-top: 1.5rem; color: var(--text-secondary); text-decoration: none; font-size: 0.85rem;">← Kataloğa Geri Dön</a>
      </div>
    `;

    // Form Olay Dinleyicisi
    document.getElementById('auth-login-form').addEventListener('submit', handleLogin);
    
    // Geçiş linki
    document.getElementById('link-to-register').addEventListener('click', (e) => {
      e.preventDefault();
      showRegister();
    });
  }

  // 2. Kayıt Olma Ekranını Göster
  function showRegister() {
    currentView = 'register';
    kabinetContent.innerHTML = `
      <div class="auth-card">
        <div class="auth-header">
          <svg viewBox="0 0 24 24">
            <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <h2>Hesab Yarat</h2>
          <p>Pulsuz qeydiyyatdan keçin, sifarişlərinizi asanlıqla izləyin.</p>
        </div>

        <form id="auth-register-form">
          <div class="form-group">
            <label for="register-email">E-poçt Ünvanı *</label>
            <input type="email" id="register-email" required placeholder="nümunə@mail.com">
          </div>
          <div class="form-group">
            <label for="register-password">Güclü Parol *</label>
            <input type="password" id="register-password" required minlength="6" placeholder="Minimum 6 simvol">
          </div>
          <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">Qeydiyyatı Tamamla</button>
        </form>

        <div class="auth-divider"><span>və ya</span></div>
        
        <a href="#" id="link-to-login" class="auth-toggle-link">Mövcud hesabla daxil ol</a>
        <a href="index.html" style="display: block; text-align: center; margin-top: 1.5rem; color: var(--text-secondary); text-decoration: none; font-size: 0.85rem;">← Kataloğa Geri Dön</a>
      </div>
    `;

    // Form Olay Dinleyicisi
    document.getElementById('auth-register-form').addEventListener('submit', handleRegister);
    
    // Geçiş linki
    document.getElementById('link-to-login').addEventListener('click', (e) => {
      e.preventDefault();
      showLogin();
    });
  }

  // 3. Kullanıcı Dashboard Ekranı
  function showDashboard(user, role) {
    currentView = 'dashboard';
    const isAdmin = role === 'admin';

    kabinetContent.innerHTML = `
      <div class="dashboard-card">
        <div class="user-avatar-wrapper">
          <svg viewBox="0 0 24 24">
            <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.34 0-10 1.67-10 5v3h20v-3c0-3.33-6.66-5-10-5z"/>
          </svg>
        </div>
        <h2 class="dashboard-title">Xoş Gəldiniz!</h2>
        <p class="dashboard-sub">Müştəri kabinetiniz aktivdir.</p>

        <div class="dashboard-info-list">
          <div class="dashboard-info-item">
            <strong>E-poçt:</strong>
            <span>${user.email}</span>
          </div>
          <div class="dashboard-info-item">
            <strong>Status / Rol:</strong>
            <span class="badge-role">${isAdmin ? 'Yönetici (Admin)' : 'Müştəri'}</span>
          </div>
          <div class="dashboard-info-item">
            <strong>Sifariş İzləmə:</strong>
            <span style="color: var(--accent-gold); font-weight:600;">Aktiv Sifariş Yoxdur</span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${isAdmin 
            ? `<a href="admin.html" class="btn btn-primary" style="background: var(--bg-dark); box-shadow: none;">⚙️ Yönetim Paneline Git</a>` 
            : `<a href="index.html" class="btn btn-primary">🛒 Alış-Verişə Başla</a>`
          }
          <button id="btn-logout-auth" class="btn btn-secondary" style="border-color: #ef4444; color: #ef4444;">Çıkış Yap</button>
        </div>
      </div>
    `;

    // Çıkış yapma dinleyicisi
    document.getElementById('btn-logout-auth').addEventListener('click', handleLogout);
  }

  // Giriş Yapma İşlemi
  async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = e.target.querySelector('button[type="submit"]');

    try {
      btn.disabled = true;
      btn.innerText = 'Giriş edilir...';

      const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;

      showToast('Giriş uğurludur!', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Giriş edilərkən xəta baş verdi.', 'error');
      btn.disabled = false;
      btn.innerText = 'Daxil Ol';
    }
  }

  // Kayıt Olma İşlemi
  async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const btn = e.target.querySelector('button[type="submit"]');

    try {
      btn.disabled = true;
      btn.innerText = 'Hesab yaradılır...';

      // 1. Supabase Auth ile kayıt et
      const { data: { user }, error: signUpError } = await window.supabaseClient.auth.signUp({ email, password });
      if (signUpError) throw signUpError;

      if (user) {
        // 2. Profiles tablosuna varsayılan 'user' rolü ile ekle
        const { error: profileError } = await window.supabaseClient
          .from('profiles')
          .insert([{ id: user.id, email: email, role: 'user' }]);

        if (profileError) throw profileError;
        
        showToast('Qeydiyyat tamamlandı! Giriş edilir...', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        showToast('E-poçt ünvanınızı təsdiqləyin (Əgər təsdiq aktivdirsə).', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Qeydiyyat zamanı xəta baş verdi.', 'error');
      btn.disabled = false;
      btn.innerText = 'Qeydiyyatı Tamamla';
    }
  }

  // Çıkış Yapma İşlemi
  async function handleLogout() {
    try {
      const { error } = await window.supabaseClient.auth.signOut();
      if (error) throw error;

      showToast('Çıxış edildi.', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      console.error(err);
      showToast('Çıxış edilərkən xəta baş verdi.', 'error');
    }
  }

  // Toast Bildirim Sistemi
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' 
      ? `<svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16" style="flex-shrink:0;"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>`
      : `<svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16" style="flex-shrink:0;"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/></svg>`;

    toast.innerHTML = `
      ${icon}
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // Sayfa yüklendiğinde kabineti başlat
  initKabinet();
});
