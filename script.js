document.addEventListener('DOMContentLoaded', () => {
    const imageGrid = document.getElementById('imageGrid');
    const searchInput = document.getElementById('searchInput');
    const totalImagesEl = document.getElementById('totalImages');
    const totalCategoriesEl = document.getElementById('totalCategories');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    const refreshBtn = document.getElementById('refreshBtn');

    let allImages = [];

    // Configuration
    // In production, this would be your Cloudflare Pages URL
    const BASE_URL = window.location.origin + '/images/'; 

    // Fetch Images Data
    async function fetchImages() {
        try {
            const response = await fetch('images.json');
            if (!response.ok) throw new Error('Failed to fetch images list');
            allImages = await response.json();
            renderGallery(allImages);
            updateStats(allImages);
        } catch (error) {
            console.error('Error:', error);
            imageGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 50px;">Error loading assets. Please ensure images.json exists.</p>`;
        }
    }

    function renderGallery(images) {
        imageGrid.innerHTML = '';
        
        if (images.length === 0) {
            imageGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 50px;">No matching images found.</p>`;
            return;
        }

        images.forEach((img, index) => {
            const card = document.createElement('div');
            card.className = 'image-card gallery-item';
            card.style.animationDelay = `${index * 0.05}s`;
            
            // Full public URL
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

        // Initialize icons for new elements
        lucide.createIcons();

        // Attach Copy Event
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
            // Fallback for non-HTTPS or other issues
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

    // Search Logic
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allImages.filter(img => 
            img.name.toLowerCase().includes(term) || 
            img.category.toLowerCase().includes(term) ||
            img.tags.some(t => t.toLowerCase().includes(term))
        );
        renderGallery(filtered);
    });

    // Refresh Logic (Manual Sync Simulation)
    refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('spinning'); // Add CSS for this if needed
        fetchImages().then(() => {
            showToast('Gallery synchronized!');
            setTimeout(() => refreshBtn.classList.remove('spinning'), 1000);
        });
    });

    // Initial Load
    fetchImages();
});
