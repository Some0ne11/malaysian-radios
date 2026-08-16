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
    const secret = import.meta.env.PUBLIC_CLIENT_SECRET;
    
    // 1. Another base64 process
    const b64 = btoa(token);
    
    // 2. Reverse string
    const reversed = b64.split('').reverse().join('');
    
    // 3. Scramble against the client_secret
    const xored = Array.from(reversed).map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ secret.charCodeAt(i % secret.length))
    ).join('');
    
    // 4. Encode for cookie safety (XOR generates non-printable ASCII which breaks cookies)
    return btoa(encodeURIComponent(xored));
}

export function deobscureToken(obscured: string): string | null {
    try {
        const secret = import.meta.env.PUBLIC_CLIENT_SECRET;
        
        // 1. Decode cookie safety
        const xored = decodeURIComponent(atob(obscured));
        
        // 2. Un-scramble the XOR
        const reversed = Array.from(xored).map((char, i) => 
            String.fromCharCode(char.charCodeAt(0) ^ secret.charCodeAt(i % secret.length))
        ).join('');
        
        // 3. Un-reverse
        const b64 = reversed.split('').reverse().join('');
        
        // 4. Un-base64
        return atob(b64);
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
