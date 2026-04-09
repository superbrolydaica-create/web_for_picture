document.addEventListener('DOMContentLoaded', () => {
    const imageGrid = document.getElementById('imageGrid');
    const searchInput = document.getElementById('searchInput');
    const totalImagesEl = document.getElementById('totalImages');
    const totalCategoriesEl = document.getElementById('totalCategories');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    const refreshBtn = document.getElementById('refreshBtn');

    let allImages = [];
    let currentCategory = 'all';

    // Configuration
    const BASE_URL = window.location.origin + '/images/'; 
    const SOURCE_FILE = 'images.json';

    // Fetch Images Data
    async function fetchImages() {
        try {
            // Show loading state
            imageGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 100px;">
                    <i data-lucide="loader-2" class="spinning" style="width: 40px; height: 40px; color: var(--primary);"></i>
                    <p style="margin-top: 15px; color: var(--text-muted);">Syncing assets from database...</p>
                </div>
            `;
            lucide.createIcons();

            const response = await fetch(SOURCE_FILE);
            if (!response.ok) throw new Error('Failed to fetch images list');
            
            allImages = await response.json();
            
            filterAndRender(currentCategory);
            updateStats(allImages);
        } catch (error) {
            console.error('Error:', error);
            imageGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 50px;">
                    <i data-lucide="alert-circle" style="width: 40px; height: 40px; margin-bottom: 15px;"></i>
                    <p>Error loading image database. Please ensure "${SOURCE_FILE}" exists and is valid JSON.</p>
                </div>
            `;
            lucide.createIcons();
        }
    }

    // Sidebar Navigation Logic
    const navItems = document.querySelectorAll('.nav-item[data-category]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update UI active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Filter by category
            currentCategory = item.dataset.category;
            filterAndRender(currentCategory);
        });
    });

    function filterAndRender(category) {
        let filtered = allImages;
        if (category !== 'all') {
            filtered = allImages.filter(img => img.category === category);
        }
        
        // Also apply search if there's text in search input
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(img => 
                img.name.toLowerCase().includes(searchTerm) || 
                img.category.toLowerCase().includes(searchTerm) ||
                img.tags.some(t => t.toLowerCase().includes(searchTerm))
            );
        }

        renderGallery(filtered);
    }

    function renderGallery(images) {
        imageGrid.innerHTML = '';
        
        if (images.length === 0) {
            imageGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 50px;">No images found in this view.</p>`;
            return;
        }

        images.forEach((img, index) => {
            const card = document.createElement('div');
            card.className = 'image-card gallery-item';
            card.style.animationDelay = `${index * 0.05}s`;
            
            const publicUrl = BASE_URL + img.filename;

            card.innerHTML = `
                <div class="card-preview">
                    <img src="images/${img.filename}" alt="${img.name}" onerror="this.src='https://via.placeholder.com/400x200/0f172a/3b82f6?text=Image+Missing'">
                </div>
                <div class="card-info">
                    <div class="card-title">${img.name}</div>
                    <div class="card-meta">
                        <span class="card-tag">${img.category}</span>
                        <span>${img.date}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="copy-btn" data-url="${publicUrl}">
                        <i data-lucide="copy"></i> Copy Link
                    </button>
                    <a href="images/${img.filename}" target="_blank" class="view-btn">
                        <i data-lucide="external-link"></i>
                    </a>
                </div>
            `;
            imageGrid.appendChild(card);
        });

        lucide.createIcons();

        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.onclick = () => copyToClipboard(btn.dataset.url);
        });
    }

    function updateStats(images) {
        totalImagesEl.textContent = images.length;
        const categories = [...new Set(images.map(img => img.category))];
        totalCategoriesEl.textContent = categories.length;
    }

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showToast('Link copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            showToast('Link copied!');
        }
    }

    function showToast(msg) {
        toastMsg.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    searchInput.addEventListener('input', () => {
        filterAndRender(currentCategory);
    });

    refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('spinning');
        fetchImages().then(() => {
            showToast('Gallery synchronized!');
            setTimeout(() => refreshBtn.classList.remove('spinning'), 1000);
        });
    });

    fetchImages();
});
