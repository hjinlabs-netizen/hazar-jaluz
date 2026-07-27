document.addEventListener('DOMContentLoaded', () => {
  let products = [];
  let isEditing = false;

  // DOM Elemanları
  const adminBody = document.getElementById('admin-body');
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

  // Güvenlik ve Rol Yetkilendirme Kontrolü
  async function checkAuth() {
    try {
      // 1. Supabase Oturumunu Kontrol Et
      const { data: { session }, error } = await window.supabaseClient.auth.getSession();
      if (error) throw error;

      if (!session) {
        // Giriş yapılmamışsa kabinete yönlendir
        alert('Bu alana girmək üçün əvvəlcə giriş etməlisiniz.');
        window.location.href = 'kabinet.html';
        return;
      }

      // 2. Profiles Tablosundan Kullanıcı Rolünü Çek
      const { data: profile, error: profileError } = await window.supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile || profile.role !== 'admin') {
        // Kullanıcı admin değilse engelle ve yönlendir
        alert('Bu alana daxil olmaq üçün "Admin" yetkiniz yoxdur!');
        window.location.href = 'kabinet.html';
        return;
      }

      // 3. Yetkili ise ekranı göster ve ürünleri çek
      adminBody.style.display = 'block';
      fetchProducts();

    } catch (err) {
      console.error('Yetkilendirme Hatası:', err);
      alert('Sistem xətası baş verdi. Kabinetə yönləndirilirsiniz.');
      window.location.href = 'kabinet.html';
    }
  }

  // 1. Ürünleri Supabase'den Getir
  async function fetchProducts() {
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
                <div class="table-img" style="display:flex; align-items:center; justify-content:center; background:#eae5db; color:var(--accent-gold);">
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

  // Çıkış Yapma İşlemi
  if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await window.supabaseClient.auth.signOut();
        window.location.href = 'kabinet.html';
      } catch (err) {
        console.error(err);
        showToast('Çıkış yapılamadı.', 'error');
      }
    });
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

  // Güvenlik doğrulamasını başlat
  checkAuth();
});
