import { fetchStations } from '../hooks/useStations';
import { getFavorites, isFavorite, toggleFavorite } from './favorites';

let offset = 15;
const limit = 15;
let isLoading = false;
let hasMore = true;
let currentCategory = 'all';

const gridEl = document.getElementById('radio-grid');
const container = document.querySelector('.grid.grid-cols-2');
const trigger = document.getElementById('load-more-trigger');

const desktopSelect = document.getElementById('category-filter') as HTMLSelectElement;
const mobileSelect = document.getElementById('category-filter-mobile') as HTMLSelectElement;

const favDesktopBtn = document.getElementById('favorites-toggle-desktop') as HTMLButtonElement;
const favMobileBtn = document.getElementById('favorites-toggle-mobile') as HTMLButtonElement;

// Helper to update favorite buttons visual state
function updateFavToggleState(isFavView: boolean) {
    [favDesktopBtn, favMobileBtn].forEach(btn => {
        if (!btn) return;
        if (isFavView) {
            btn.classList.add('text-red-500', 'bg-red-50', 'dark:bg-red-950/30', 'border-red-200', 'dark:border-red-900/50');
            btn.classList.remove('text-slate-700', 'dark:text-zinc-300');
            btn.querySelector('svg')?.classList.add('fill-red-500');
        } else {
            btn.classList.remove('text-red-500', 'bg-red-50', 'dark:bg-red-950/30', 'border-red-200', 'dark:border-red-900/50');
            btn.classList.add('text-slate-700', 'dark:text-zinc-300');
            btn.querySelector('svg')?.classList.remove('fill-red-500');
        }
    });
}

// Background token refresh (every 55 minutes)
setInterval(async () => {
    console.log('[Token Refresh] Fetching new token in background...');
    const res = await fetchStations(0, 0, 'all');
    if (res && res.token && gridEl) {
        gridEl.dataset.token = res.token;
        console.log('[Token Refresh] Token successfully refreshed.');
    }
}, 55 * 60 * 1000);

async function loadStations(isReset = false) {
    if (!container || !gridEl) return;
    
    if (isLoading || (!hasMore && !isReset)) return;
    
    if (isReset) {
        offset = 0;
        hasMore = true;
        container.innerHTML = '';
        if (trigger) trigger.style.display = 'flex';
    }
    
    isLoading = true;
    
    try {
        if (currentCategory === 'favorites') {
            const favs = getFavorites();
            // Paginate favorites locally
            const paginatedFavs = favs.slice(offset, offset + limit);
            
            if (paginatedFavs.length > 0) {
                renderCards(paginatedFavs, true);
                offset += limit;
                if (offset >= favs.length) {
                    hasMore = false;
                    if (trigger) trigger.style.display = 'none';
                }
            } else {
                if (isReset) {
                    container.innerHTML = `
                        <div class="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 dark:text-zinc-500">
                            <p>No favorite stations found. Click the heart icon on a station to save it.</p>
                        </div>
                    `;
                }
                hasMore = false;
                if (trigger) trigger.style.display = 'none';
            }
            isLoading = false;
            return;
        }

        const res = await fetchStations(limit, offset, currentCategory);
        if (res && res.stations.length > 0) {
            gridEl.dataset.token = res.token; // Update token just in case
            
            renderCards(res.stations, false);
            
            offset += limit;
            
            if (res.stations.length < limit) {
                hasMore = false;
                if (trigger) trigger.style.display = 'none';
            }
        } else {
            if (isReset) {
                container.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 dark:text-zinc-500">
                        <p>No radio stations found for this category.</p>
                    </div>
                `;
            }
            hasMore = false;
            if (trigger) trigger.style.display = 'none';
        }
    } catch (err: any) {
        if (err.message === "BANNED") {
            window.location.reload();
        } else {
            console.error(err);
        }
    }
    
    isLoading = false;
}

function renderCards(stationsList: any[], isFavData: boolean) {
    if (!container) return;
    
    stationsList.forEach(station => {
        const isProd = import.meta.env.PROD;
        // For favorites, the logo is already in the object. For API, it's logo_url
        const logoUrl = isFavData ? station.logo : (station.logo_url || '');
        const categoryId = isFavData ? station.category : (station.category_id || 'UNKNOWN');
        const streamUrl = isFavData ? '' : station.stream_url; // Not used from dataset for favorites
        
        const optimizedLogo = logoUrl 
            ? (isProd 
                ? `/_vercel/image?url=${encodeURIComponent(logoUrl)}&w=640&q=75`
                : `/_image?href=${encodeURIComponent(logoUrl)}&w=400&h=400&f=webp`)
            : '';

        const favStateClass = isFavorite(station.id) ? 'fill-red-500 text-red-500' : '';

        const btn = document.createElement('button');
        btn.className = "radio-card-btn w-full block relative rounded-none bg-white dark:bg-zinc-900 shadow-sm border border-slate-200 dark:border-zinc-800 hover:shadow-md hover:border-primary/50 transition-all duration-300 group overflow-hidden text-center h-full active:scale-95 flex flex-col items-center";
        btn.dataset.id = station.id;
        btn.dataset.name = station.name;
        btn.dataset.category = categoryId;
        btn.dataset.logo = logoUrl;
        if (!isFavData) btn.dataset.stream = streamUrl;
        
        btn.innerHTML = `
            <div class="w-full aspect-square bg-slate-100 dark:bg-zinc-800 overflow-hidden relative">
                ${optimizedLogo ? 
                    `<img src="${optimizedLogo}" alt="${station.name} Logo" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="eager" decoding="async" />` 
                    : `<div class="w-full h-full flex items-center justify-center text-slate-400">No Image</div>`
                }
                <div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                <!-- Play indicator (hidden by default, shown on hover) -->
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                    <div class="w-12 h-12 rounded-none bg-primary text-primary-content flex items-center justify-center shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play w-6 h-6 ml-1"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                    </div>
                </div>
            </div>
            
            <!-- Info -->
            <div class="w-full p-4 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-left">
                <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1">
                        <h3 class="font-bold text-slate-900 dark:text-zinc-100 truncate group-hover:text-primary transition-colors">${station.name}</h3>
                        <p class="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold mt-1">${categoryId}</p>
                    </div>
                    <div role="button" class="favorite-btn shrink-0 text-slate-400 hover:text-red-500 transition-colors z-10 cursor-pointer" data-fav-id="${station.id}" aria-label="Toggle Favorite">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="heart-icon ${favStateClass}"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
                    </div>
                </div>
            </div>
        `;
        
        btn.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).closest('.favorite-btn')) return;
            const el = e.currentTarget as HTMLButtonElement;
            const event = new CustomEvent('play-station', {
                detail: {
                    id: el.dataset.id,
                    name: el.dataset.name,
                    category: el.dataset.category,
                    logo: el.dataset.logo
                }
            });
            window.dispatchEvent(event);
        });
        
        container.appendChild(btn);
    });
}

function handleCategoryChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    currentCategory = val;
    
    // Sync selects
    if (desktopSelect) desktopSelect.value = val;
    if (mobileSelect) mobileSelect.value = val;
    
    loadStations(true);
}

function handleFavoritesToggle(e: Event) {
    if (currentCategory === 'favorites') {
        // Toggle back to 'all'
        currentCategory = desktopSelect ? desktopSelect.value : 'all';
        if (currentCategory === 'favorites') currentCategory = 'all'; // Edge case
        updateFavToggleState(false);
    } else {
        // Toggle to favorites
        currentCategory = 'favorites';
        updateFavToggleState(true);
    }
    loadStations(true);
}

if (desktopSelect) desktopSelect.addEventListener('change', (e) => {
    updateFavToggleState(false);
    handleCategoryChange(e);
});
if (mobileSelect) mobileSelect.addEventListener('change', (e) => {
    updateFavToggleState(false);
    handleCategoryChange(e);
});

if (favDesktopBtn) favDesktopBtn.addEventListener('click', handleFavoritesToggle);
if (favMobileBtn) favMobileBtn.addEventListener('click', handleFavoritesToggle);

// Setup Lazy Loading via Intersection Observer
if (trigger && container && gridEl) {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadStations(false);
        }
    });
    
    observer.observe(trigger);
}

// Keep track of the currently playing station ID
let currentPlayingId: string | null = null;
window.addEventListener('play-station', (e: any) => {
    currentPlayingId = e.detail.id;
});

// Handle skip back and skip forward
function playNeighbor(direction: number) {
    if (!currentPlayingId) return;
    
    const cards = Array.from(document.querySelectorAll('.radio-card-btn')) as HTMLButtonElement[];
    if (cards.length === 0) return;
    
    const currentIndex = cards.findIndex(c => c.dataset.id === currentPlayingId);
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex + direction;
    
    // Loop around
    if (nextIndex < 0) nextIndex = cards.length - 1;
    if (nextIndex >= cards.length) nextIndex = 0;
    
    const nextCard = cards[nextIndex];
    if (nextCard) {
        nextCard.click();
    }
}

window.addEventListener('request-play-next', () => playNeighbor(1));
window.addEventListener('request-play-prev', () => playNeighbor(-1));

// Initial setup: sync heart icons on SSR rendered cards
document.addEventListener('DOMContentLoaded', () => {
    syncHeartIcons();
});

// Sync hearts when favorites change globally
window.addEventListener('favorites-updated', () => {
    syncHeartIcons();
    if (currentCategory === 'favorites') {
        loadStations(true);
    }
});

function syncHeartIcons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const id = (btn as HTMLElement).dataset.favId;
        if (id && isFavorite(id)) {
            btn.querySelector('.heart-icon')?.classList.add('fill-red-500', 'text-red-500');
        } else {
            btn.querySelector('.heart-icon')?.classList.remove('fill-red-500', 'text-red-500');
        }
    });
}

// Global delegated event listener for favorite buttons
document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.favorite-btn');
    if (btn) {
        e.preventDefault();
        e.stopPropagation();
        
        const id = (btn as HTMLElement).dataset.favId;
        if (!id) return;
        
        // Find the parent card to get metadata
        const card = btn.closest('.radio-card-btn') as HTMLElement;
        if (!card) return;
        
        toggleFavorite({
            id: id,
            name: card.dataset.name || '',
            category: card.dataset.category || '',
            logo: card.dataset.logo || ''
        });
    }
});
