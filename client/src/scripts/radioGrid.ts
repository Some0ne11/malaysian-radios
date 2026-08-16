import { fetchStations } from '../hooks/useStations';

let offset = 15;
const limit = 15;
let isLoading = false;
let hasMore = true;

const gridEl = document.getElementById('radio-grid');
const container = document.querySelector('.grid.grid-cols-2');
const trigger = document.getElementById('load-more-trigger');

// Background token refresh (every 55 minutes)
setInterval(async () => {
    console.log('[Token Refresh] Fetching new token in background...');
    // Limit=0 fetches 0 stations, just returning a fresh token
    const res = await fetchStations(0, 0);
    if (res && res.token && gridEl) {
        gridEl.dataset.token = res.token;
        console.log('[Token Refresh] Token successfully refreshed.');
    }
}, 55 * 60 * 1000);

// Setup Lazy Loading via Intersection Observer
if (trigger && container && gridEl) {
    const observer = new IntersectionObserver(async (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
            isLoading = true;
            
            const res = await fetchStations(limit, offset);
            if (res && res.stations.length > 0) {
                gridEl.dataset.token = res.token; // Update token just in case
                
                res.stations.forEach(station => {
                    const btn = document.createElement('button');
                    btn.className = "radio-card-btn w-full block relative rounded-none bg-white dark:bg-zinc-900 shadow-sm border border-slate-200 dark:border-zinc-800 hover:shadow-md hover:border-primary/50 transition-all duration-300 group overflow-hidden text-center h-full active:scale-95 flex flex-col items-center";
                    btn.dataset.id = station.id;
                    btn.dataset.name = station.name;
                    btn.dataset.category = station.category_id || 'UNKNOWN';
                    btn.dataset.logo = station.logo_url || '';
                    btn.dataset.stream = station.stream_url;
                    
                    btn.innerHTML = `
                        <!-- Logo -->
                        <div class="w-full aspect-square bg-slate-100 dark:bg-zinc-800 overflow-hidden relative">
                            <img src="${station.logo_url || ''}" alt="${station.name} Logo" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                            <div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                            <!-- Play indicator (hidden by default, shown on hover) -->
                            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                                <div class="w-12 h-12 rounded-none bg-primary text-primary-content flex items-center justify-center shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play w-6 h-6 ml-1"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Info -->
                        <div class="w-full p-4 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                            <h3 class="font-bold text-slate-900 dark:text-zinc-100 truncate group-hover:text-primary transition-colors">${station.name}</h3>
                            <p class="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold mt-1">${station.category_id || 'UNKNOWN'}</p>
                        </div>
                    `;
                    
                    btn.addEventListener('click', (e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        const event = new CustomEvent('play-station', {
                            detail: {
                                id: el.dataset.id,
                                name: el.dataset.name,
                                category: el.dataset.category,
                                logo: el.dataset.logo
                                // Notice: stream is NOT passed here anymore to enforce secure fetch
                            }
                        });
                        window.dispatchEvent(event);
                    });
                    
                    container.appendChild(btn);
                });
                
                offset += limit;
                
                if (res.stations.length < limit) {
                    hasMore = false;
                    trigger.style.display = 'none';
                }
            } else {
                hasMore = false;
                trigger.style.display = 'none';
            }
            
            isLoading = false;
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
