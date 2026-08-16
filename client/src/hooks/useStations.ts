export interface Station {
    id: string;
    name: string;
    category_id: string | null;
    stream_url: string;
    logo_url: string | null;
    status: string;
    clear_keys: string | null;
    subscription_type: string;
}

export interface StationsResponse {
    token: string;
    stations: Station[];
}

export function obscureToken(token: string): string {
    // Basic obfuscation to satisfy security by obscurity in DevTools
    return btoa(token).split('').reverse().join('');
}

export function deobscureToken(obscured: string): string | null {
    try {
        const reversed = obscured.split('').reverse().join('');
        return atob(reversed);
    } catch {
        return null;
    }
}

export async function fetchToken(cachedToken?: string | null, forceRefresh: boolean = false): Promise<string | null> {
    if (cachedToken && !forceRefresh) {
        return cachedToken;
    }

    const baseUrl = import.meta.env.PUBLIC_API_BASE_URL;
    const clientSecret = import.meta.env.PUBLIC_CLIENT_SECRET;
    
    try {
        const url = `${baseUrl.replace(/\/$/, '')}/api/token`;  // or /api/token?hmac=clientSecret
        const res = await fetch(url, {
            headers: {
                'X-Client-Secret': clientSecret
            }
        });
        
        if (!res.ok) {
            console.error(`Failed to fetch token: ${res.statusText}`);
            return null;
        }
        
        const data = await res.json();
        return data.token;
    } catch (error) {
        console.error("Error fetching token:", error);
        return null;
    }
}

export async function fetchStations(limit: number = 15, offset: number = 0, providedToken?: string | null): Promise<StationsResponse | null> {
    const baseUrl = import.meta.env.PUBLIC_API_BASE_URL;
    const forceRefresh = limit === 0;
    
    // Client-side auto-cookie reading
    let tokenToUse = providedToken;
    if (!tokenToUse && typeof document !== 'undefined') {
        const match = document.cookie.match(new RegExp('(^| )mr_session=([^;]+)'));
        if (match) {
            tokenToUse = deobscureToken(match[2]);
        }
    }

    const token = await fetchToken(tokenToUse, forceRefresh);
    if (!token) return null;

    // Client-side auto-cookie writing if we fetched a fresh token
    if (typeof document !== 'undefined' && token !== tokenToUse) {
        const obscured = obscureToken(token);
        document.cookie = `mr_session=${obscured}; max-age=${55 * 60}; path=/; SameSite=Strict`;
    }
    
    if (limit === 0) {
        return { token, stations: [] };
    }
    
    try {
        const url = `${baseUrl.replace(/\/$/, '')}/api/stations?limit=${limit}&offset=${offset}`; // or api/stations?limit={limit}&offset={offset}&token={token}
        
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!res.ok) {
            console.error(`Failed to fetch stations: ${res.statusText}`);
            return null;
        }
        
        const stations: Station[] = await res.json();
        return {
            token,
            stations
        };
    } catch (error) {
        console.error("Error fetching stations:", error);
        return null;
    }
}

export async function fetchStationById(id: string, token: string): Promise<Station | null> {
    const baseUrl = import.meta.env.PUBLIC_API_BASE_URL;
    
    try {
        const url = `${baseUrl.replace(/\/$/, '')}/api/stations/${id}`; // or /api/stations/${id}?token={token}
        
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!res.ok) {
            console.error(`Failed to fetch station ${id}: ${res.statusText}`);
            return null;
        }
        
        const data: Station = await res.json();
        return data;
    } catch (error) {
        console.error(`Error fetching station ${id}:`, error);
        return null;
    }
}
