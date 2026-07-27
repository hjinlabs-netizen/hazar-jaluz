document.addEventListener('DOMContentLoaded', () => {
  let products = [];
  let isEditing = false;

  // DOM Elemanları
  const loginOverlay = document.getElementById('login-overlay');
  const loginForm = document.getElementById('login-form');
  const adminPasswordInput = document.getElementById('admin-password');
  const adminMainContent = document.getElementById('admin-main-content');
  const btnLogout = document.getElementById('btn-logout');

  const productsListBody = document.getElementById('admin-products-list');
  const productForm = document.getElementById('product-form');
  const formTitle = document.getElementById('form-title');
  const btnSubmitText = document.getElementById('btn-submit-text');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  const productIdInput = document.getElementById('product-id');
  const productNameInput = document.getElementById('product-name');
  const productCategorySelect = document.getElementById('product-category');
  const productPriceInput = document.getElementById('product-price');
  const productDescriptionTextarea = document.getElementById('product-description');
  const productImageInput = document.getElementById('product-image');
  const uploadInfoText = document.getElementById('upload-info-text');
  const imagePreviewBox = document.getElementById('image-preview-box');
  const imagePreview = document.getElementById('image-preview');
  const btnRemoveImage = document.getElementById('btn-remove-image');
  const toastContainer = document.getElementById('toast-container');
  const adminGrid = document.querySelector('.admin-grid');

  // Kategorilerin okunaklı isimleri
  const categoryNames = {
    zebra: 'Zebra Jaluzi',
    ahsap: 'Ahşap Jaluzi',
    stor: 'Stor Perde',
    metal: 'Metal Jaluzi',
    dikey: 'Dikey Perde'
  };

  // Güvenli Şifre Kontrolü (Şifre: hazar2026)
  // hazar2026 şifresinin SHA-256 Hash karşılığı
  const ADMIN_PASSWORD_HASH = "33e695d38a0f9b65743c3a9f0fa9cc0c3a2f3fcf2f4f2c5ef2cd33e8c950269f";

  // SHA-256 Hash Hesaplama Fonksiyonu
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Oturum Kontrolü
  function checkSession() {
    const isAuthenticated = sessionStorage.getItem('hazar_admin_auth') === 'true';
    if (isAuthenticated) {
      loginOverlay.style.display = 'none';
      adminMainContent.style.display = 'block';
      fetchProducts(); // Ürünleri çek
    } else {
      loginOverlay.style.display = 'flex';
      adminMainContent.style.display = 'none';
    }
  }

  // Giriş Yapma Formu Dinleyicisi
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const enteredPassword = adminPasswordInput.value;
      const enteredHash = await sha256(enteredPassword);

      if (enteredHash === ADMIN_PASSWORD_HASH) {
        sessionStorage.setItem('hazar_admin_auth', 'true');
        showToast('Giriş başarılı! Hoş geldiniz.', 'success');
        checkSession();
      } else {
        showToast('Hatalı şifre! Lütfen tekrar deneyin.', 'error');
        adminPasswordInput.value = '';
        adminPasswordInput.focus();
      }
    });
  }

  // Çıkış Yapma Butonu Dinleyicisi
  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.removeItem('hazar_admin_auth');
      window.location.reload();
    });
  }

  // Config Kontrolü ve Rehber Gösterimi
  function checkConfig() {
    if (typeof window.SUPABASE_URL === 'undefined' || !window.SUPABASE_URL || window.SUPABASE_URL.includes('BURAYA_SUPABASE_PROJECT_URL')) {
      // Eğer Supabase ayarları yapılmadıysa kurulum kılavuzunu göster
      adminGrid.innerHTML = `
        <div class="admin-card" style="grid-column: 1 / -1; max-width: 800px; margin: 0 auto;">
          <h3 style="color: var(--accent-gold); font-size: 1.6rem; border-left: 4px solid var(--accent-gold); padding-left: 0.8rem; margin-bottom: 1.5rem;">
            ☁️ Supabase Kurulum Rehberi (Son Adım!)
          </h3>
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 1.05rem;">
            Sitenizi yayına almak, kodlama yapmadan jaluzi ekleyip silmek için ücretsiz bir <strong>Supabase</strong> hesabı oluşturmanız gerekir. Aşağıdaki 4 adımı sırayla uygulayın:
          </p>
          
          <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem;">
            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 1.2rem; border-radius: 8px;">
              <strong style="color: var(--text-primary); display: block; margin-bottom: 0.4rem;">1. Üye Olun ve Proje Oluşturun</strong>
              <span style="color: var(--text-secondary); font-size: 0.95rem;">
                <a href="https://supabase.com" target="_blank" style="color: var(--accent-gold); text-decoration: underline;">Supabase.com</a> sitesine gidin, ücretsiz üye olun ve <strong>"New Project"</strong> diyerek <strong>Hazar Jaluz</strong> adında bir proje oluşturun. Güçlü bir şifre belirleyin.
              </span>
            </div>

            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 1.2rem; border-radius: 8px;">
              <strong style="color: var(--text-primary); display: block; margin-bottom: 0.4rem;">2. Tabloyu Oluşturun (SQL Editörü)</strong>
              <span style="color: var(--text-secondary); font-size: 0.95rem;">
                Sol menüdeki <strong>SQL Editor</strong> simgesine tıklayın. <strong>"New Query"</strong> seçin, aşağıdaki kodu yapıştırıp sağ alttaki <strong>"Run"</strong> butonuna basın:
              </span>
              <pre style="background: #0a0b0d; padding: 1rem; border-radius: 6px; color: #4db6ac; overflow-x: auto; font-size: 0.85rem; margin-top: 0.8rem; border: 1px solid rgba(255,255,255,0.05);">
create table products (
  id bigint generated by default as identity primary key,
  name text not null,
  category text not null,
  price numeric not null,
  description text,
  image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);</pre>
            </div>

            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 1.2rem; border-radius: 8px;">
              <strong style="color: var(--text-primary); display: block; margin-bottom: 0.4rem;">3. Resim Klasörünü Oluşturun (Storage)</strong>
              <span style="color: var(--text-secondary); font-size: 0.95rem;">
                Sol menüdeki <strong>Storage</strong> simgesine tıklayın. <strong>"New Bucket"</strong> butonuna basın. Kova ismini küçük harflerle <code style="color: var(--accent-gold); background: rgba(212,175,55,0.1); padding: 2px 6px; border-radius: 4px;">product-images</code> yapın. Altındaki <strong>"Public bucket"</strong> seçeneğini mutlaka <strong>aktif hale getirin</strong> ve kaydedin.
              </span>
            </div>

            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 1.2rem; border-radius: 8px;">
              <strong style="color: var(--text-primary); display: block; margin-bottom: 0.4rem;">4. Bağlantı Bilgilerini Sitenize Ekleyin</strong>
              <span style="color: var(--text-secondary); font-size: 0.95rem;">
                Supabase ekranında sol alttaki <strong>Settings (Dişli simgesi) -> API</strong> sayfasına gidin. Buradaki <strong>Project URL</strong> ve <strong>anon public key</strong> değerlerini kopyalayın. Bilgisayarınızdaki <code style="color: var(--accent-gold);">config.js</code> dosyasını açıp ilgili alanlara yapıştırıp kaydedin.
              </span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <button onclick="window.location.reload();" class="btn btn-primary" style="width: auto; padding: 0.8rem 2rem;">
              Bilgileri Kaydettim, Sayfayı Yenile 🔄
            </button>
          </div>
        </div>
      `;
      return false;
    }
    return true;
  }

  // 1. Ürünleri Supabase'den Getir
  async function fetchProducts() {
    if (!checkConfig()) return;

    try {
      const { data, error } = await window.supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      products = data || [];
      renderProductsTable();
    } catch (err) {
      console.error(err);
      showToast('Ürün listesi veritabanından alınamadı!', 'error');
    }
  }

  // 2. Tabloyu Doldur
  function renderProductsTable() {
    if (products.length === 0) {
      productsListBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
            Katalogda kayıtlı ürün bulunmuyor.
          </td>
        </tr>
      `;
      return;
    }

    productsListBody.innerHTML = products.map(product => {
      const categoryLabel = categoryNames[product.category] || product.category;

      return `
        <tr data-id="${product.id}">
          <td>
            ${product.image 
              ? `<img src="${product.image}" class="table-img" alt="${product.name}">` 
              : `
                <div class="table-img" style="display:flex; align-items:center; justify-content:center; background:#161a21; color:var(--accent-gold);">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M19 19H5V5h14v14zM5 3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5z"/></svg>
                </div>
              `
            }
          </td>
          <td style="font-weight: 500;">${product.name}</td>
          <td><span style="color: var(--accent-gold); font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">${categoryLabel}</span></td>
          <td><strong>${product.price} AZN</strong></td>
          <td style="text-align: center;">
            <div class="table-actions">
              <button class="btn-action btn-edit" data-id="${product.id}" title="Düzenle">
                <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
              </button>
              <button class="btn-action btn-delete" data-id="${product.id}" title="Sil">
                <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Düzenle ve Sil butonlarına olay dinleyicisi ekle
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        handleEditClick(id);
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        handleDeleteClick(id);
      });
    });
  }

  // 3. Dosya Seçildiğinde Önizleme Göster
  if (productImageInput) {
    productImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          imagePreview.src = event.target.result;
          uploadInfoText.style.display = 'none';
          imagePreviewBox.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // 4. Önizleme Resmini Kaldır
  if (btnRemoveImage) {
    btnRemoveImage.addEventListener('click', () => {
      productImageInput.value = '';
      imagePreview.src = '';
      imagePreviewBox.style.display = 'none';
      uploadInfoText.style.display = 'flex';
    });
  }

  // 5. Düzenle Moduna Geçiş
  function handleEditClick(id) {
    const product = products.find(p => p.id == id);
    if (!product) return;

    isEditing = true;
    formTitle.innerText = 'Jaluzi Güncelle';
    btnSubmitText.innerText = 'Değişiklikleri Kaydet';
    btnCancelEdit.style.display = 'inline-flex';

    // Form alanlarını doldur
    productIdInput.value = product.id;
    productNameInput.value = product.name;
    productCategorySelect.value = product.category;
    productPriceInput.value = product.price;
    productDescriptionTextarea.value = product.description || '';

    // Resim önizlemesi ayarla
    if (product.image) {
      imagePreview.src = product.image;
      uploadInfoText.style.display = 'none';
      imagePreviewBox.style.display = 'block';
    } else {
      productImageInput.value = '';
      imagePreview.src = '';
      imagePreviewBox.style.display = 'none';
      uploadInfoText.style.display = 'flex';
    }

    // Form alanına scroll yap
    productForm.scrollIntoView({ behavior: 'smooth' });
  }

  // 6. Düzenleme Modundan Çık / İptal Et
  if (btnCancelEdit) {
    btnCancelEdit.addEventListener('click', () => {
      resetForm();
    });
  }

  function resetForm() {
    isEditing = false;
    formTitle.innerText = 'Yeni Jaluzi Ekle';
    btnSubmitText.innerText = 'Ürünü Yayınla';
    btnCancelEdit.style.display = 'none';
    
    productForm.reset();
    productIdInput.value = '';
    
    // Resim alanlarını sıfırla
    productImageInput.value = '';
    imagePreview.src = '';
    imagePreviewBox.style.display = 'none';
    uploadInfoText.style.display = 'flex';
  }

  // Resim Adı Ayıklama Yardımcısı
  function getFileNameFromUrl(url) {
    if (!url) return null;
    const parts = url.split('/');
    return parts[parts.length - 1];
  }

  // 7. Form Gönderme (Supabase Veritabanına Ekleme / Güncelleme)
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = productNameInput.value;
      const category = productCategorySelect.value;
      const price = parseFloat(productPriceInput.value);
      const description = productDescriptionTextarea.value;
      const file = productImageInput.files[0];
      const id = productIdInput.value;

      try {
        btnSubmitText.disabled = true;
        btnSubmitText.innerText = isEditing ? 'Güncelleniyor...' : 'Yükleniyor...';

        let imageUrl = null;

        // Düzenleme modunda eski resim bilgisi
        if (isEditing) {
          const currentProduct = products.find(p => p.id == id);
          imageUrl = currentProduct.image;
        }

        // 1. Resim Seçildiyse Supabase Storage'a Yükle
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          // Storage'a yükle
          const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
            .from('product-images')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // Public URL'ini al
          const { data: { publicUrl } } = window.supabaseClient.storage
            .from('product-images')
            .getPublicUrl(fileName);

          imageUrl = publicUrl;

          // Eğer güncelleme modundaysak ve eski bir resim varsa onu storage'dan sil
          if (isEditing) {
            const currentProduct = products.find(p => p.id == id);
            const oldFileName = getFileNameFromUrl(currentProduct.image);
            if (oldFileName) {
              await window.supabaseClient.storage.from('product-images').remove([oldFileName]);
            }
          }
        }

        // 2. Veritabanına Yaz (Insert veya Update)
        if (isEditing) {
          const { error } = await window.supabaseClient
            .from('products')
            .update({ name, category, price, description, image: imageUrl })
            .eq('id', id);

          if (error) throw error;
          showToast('Jaluzi başarıyla güncellendi!', 'success');
        } else {
          const { error } = await window.supabaseClient
            .from('products')
            .insert([{ name, category, price, description, image: imageUrl }]);

          if (error) throw error;
          showToast('Yeni jaluzi kataloğa eklendi!', 'success');
        }

        resetForm();
        fetchProducts();
      } catch (err) {
        console.error(err);
        showToast(err.message || 'Bir hata oluştu.', 'error');
      } finally {
        btnSubmitText.disabled = false;
        btnSubmitText.innerText = isEditing ? 'Değişiklikleri Kaydet' : 'Ürünü Yayınla';
      }
    });
  }

  // 8. Silme İşlemi (Supabase DB ve Storage'dan kaldır)
  async function handleDeleteClick(id) {
    const product = products.find(p => p.id == id);
    if (!product) return;

    const confirmDelete = confirm(`"${product.name}" isimli jaluziyi silmek istediğinizden emin misiniz?`);
    if (!confirmDelete) return;

    try {
      // 1. Storage'dan resmi sil
      const fileName = getFileNameFromUrl(product.image);
      if (fileName) {
        await window.supabaseClient.storage.from('product-images').remove([fileName]);
      }

      // 2. Veritabanından kaydı sil
      const { error } = await window.supabaseClient
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('Jaluzi başarıyla silindi.', 'success');
      
      if (productIdInput.value == id) {
        resetForm();
      }

      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast('Silme işlemi sırasında hata oluştu.', 'error');
    }
  }

  // 9. Toast Bildirim Sistemi
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

    // 3 saniye sonra kaldır
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // Başlangıçta Oturum Kontrolü yap
  checkSession();
});
