export interface FavoriteStation {
    id: string;
    name: string;
    category: string;
    logo: string;
}

const STORAGE_KEY = 'mr_favorites';

export function getFavorites(): FavoriteStation[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Failed to parse favorites from localStorage', e);
    }
    return [];
}

export function isFavorite(id: string): boolean {
    const favs = getFavorites();
    return favs.some(s => s.id === id);
}

export function toggleFavorite(station: FavoriteStation): boolean {
    let favs = getFavorites();
    const index = favs.findIndex(s => s.id === station.id);
    
    let isNowFavorite = false;
    if (index >= 0) {
        // Remove it
        favs.splice(index, 1);
    } else {
        // Add it
        favs.push(station);
        isNowFavorite = true;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    
    // Dispatch a global event so UI can sync
    window.dispatchEvent(new CustomEvent('favorites-updated', { 
        detail: { id: station.id, isFavorite: isNowFavorite }
    }));
    
    return isNowFavorite;
}
