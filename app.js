document.addEventListener('DOMContentLoaded', () => {
  let products = [];
  let activeCategory = 'all';
  let searchQuery = '';

  const productsContainer = document.getElementById('products-container');
  const searchInput = document.getElementById('search-input');
  const filterButtons = document.querySelectorAll('.filter-btn');

  // Swiper Slider Başlat
  const heroSwiper = new Swiper('.swiper-hero', {
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
  });

  // Kategorilerin okunaklı isimleri
  const categoryNames = {
    all: 'Tümü',
    zebra: 'Zebra Jaluzi',
    ahsap: 'Ahşap Jaluzi',
    stor: 'Stor Perde',
    metal: 'Metal Jaluzi',
    dikey: 'Dikey Perde'
  };

  // WhatsApp Sipariş Numarası (Kullanıcı dilerse değiştirebilir)
  const WHATSAPP_NUMBER = '994501234567'; 

  // Config kontrolü
  function checkConfig() {
    if (typeof window.SUPABASE_URL === 'undefined' || !window.SUPABASE_URL || window.SUPABASE_URL.includes('BURAYA_SUPABASE_PROJECT_URL')) {
      productsContainer.innerHTML = `
        <div class="no-products" style="border-color: var(--accent-gold);">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          <h3>Supabase Kurulumu Gerekli</h3>
          <p style="color: var(--text-secondary); max-width: 500px; margin: 0.5rem auto;">
            Sitenizi yayına almadan önce lütfen <strong>config.js</strong> dosyasını açın ve kendi Supabase bilgilerinizi girin.
          </p>
          <div style="margin-top: 1.5rem;">
            <a href="kabinet.html" class="btn btn-primary" style="width: auto;">Kurulum Rehberini İncele</a>
          </div>
        </div>
      `;
      return false;
    }
    return true;
  }

  // Ürünleri Supabase'den Çek
  async function fetchProducts() {
    if (!checkConfig()) return;

    try {
      productsContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
          <p style="color: var(--text-secondary);">Ürünler yükleniyor...</p>
        </div>
      `;

      // Supabase'den verileri getir (tarihe göre sıralı)
      const { data, error } = await window.supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      products = data || [];
      renderProducts();
    } catch (err) {
      console.error('Veri çekme hatası:', err);
      productsContainer.innerHTML = `
        <div class="no-products">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          <h3>Bağlantı Hatası</h3>
          <p style="color: var(--text-secondary);">Supabase veritabanına bağlanılamadı. Bilgilerinizi doğru girdiğinizden emin olun.</p>
        </div>
      `;
    }
  }

  // Ürünleri Arayüze Yazdır
  function renderProducts() {
    // Filtreleme mantığı
    const filteredProducts = products.filter(product => {
      const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });

    if (filteredProducts.length === 0) {
      productsContainer.innerHTML = `
        <div class="no-products">
          <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <h3>Ürün Bulunamadı</h3>
          <p style="color: var(--text-secondary);">Aramanıza veya seçtiğiniz kategoriye uygun jaluzi modeli bulunmuyor.</p>
        </div>
      `;
      return;
    }

    productsContainer.innerHTML = filteredProducts.map(product => {
      const categoryLabel = categoryNames[product.category] || product.category;
      
      // WhatsApp mesaj metnini hazırla (Azerice/Türkçe olarak)
      const encodedMsg = encodeURIComponent(
        `Salam Hazar Jaluz! Saytınızda gördüyüm bu məhsul haqqında məlumat almaq istəyirəm:\n\n` +
        `📦 *Məhsul:* ${product.name}\n` +
        `📂 *Kateqoriya:* ${categoryLabel}\n` +
        `💰 *Qiymət:* ${product.price} AZN / m²\n\n` +
        `Ölçü götürülməsi və sifariş üçün mənimlə əlaqə saxlaya bilərsinizmi?`
      );
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`;

      return `
        <div class="product-card" data-id="${product.id}">
          <div class="product-image-wrapper">
            ${product.image 
              ? `<img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` 
              : ''
            }
            <div class="fallback-image-placeholder" style="${product.image ? 'display: none;' : 'display: flex;'}">
              <svg viewBox="0 0 24 24">
                <path d="M19 19H5V5h14v14zM5 3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5zm12 6H7v2h10V9zm0 4H7v2h10v-2zm0 4H7v2h10v-2zm0-12H7v2h10V5z"/>
              </svg>
              <span style="font-size: 0.85rem; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">HAZAR Premium</span>
            </div>
            <span class="product-badge">${categoryLabel}</span>
          </div>
          <div class="product-info">
            <span class="product-category-text">${product.category}</span>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-desc">${product.description || 'Bu jaluzi modeli üçün açıklama belirtilmemiş.'}</p>
            <div class="product-footer">
              <div class="product-price">
                <span class="product-price-label">Başlanğıc Qiyməti</span>
                <span class="product-price-value">${product.price}<span>AZN/m²</span></span>
              </div>
              <a href="${whatsappUrl}" target="_blank" class="btn-order-whatsapp">
                <svg viewBox="0 0 24 24">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01-1.87-1.87-4.36-2.9-7.01-2.9zm5.79 14c-.24.68-1.42 1.3-1.95 1.38-.49.07-1.12.11-3.23-.76-2.69-1.11-4.42-3.86-4.56-4.05-.13-.19-1.11-1.48-1.11-2.81 0-1.33.7-1.98.94-2.24.24-.26.54-.33.72-.33.18 0 .36.01.52.02.16.01.38-.06.59.44.22.54.76 1.85.83 1.98.07.13.11.29.02.46-.09.18-.17.29-.33.48-.16.19-.34.42-.49.56-.16.16-.33.34-.14.67.19.32.84 1.39 1.8 2.25.96.86 1.78 1.12 2.03 1.25.25.13.39.11.54-.06.15-.17.63-.73.8-1 .17-.26.34-.22.58-.13.24.09 1.53.72 1.8 1 .27.13.45.24.51.35.07.11.07.65-.17 1.33z"/>
                </svg>
                Sifariş Et
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Arama Girişi Dinleyicisi
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderProducts();
  });

  // Filtre Butonları Dinleyicisi
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      activeCategory = button.getAttribute('data-category');
      renderProducts();
    });
  });

  // Başlangıçta verileri getir
  fetchProducts();
});
