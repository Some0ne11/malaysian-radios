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

let activeToken: string | null = null;

export async function fetchToken(): Promise<string | null> {
    const baseUrl = import.meta.env.PUBLIC_API_BASE_URL;
    const clientSecret = import.meta.env.PUBLIC_CLIENT_SECRET;
    
    try {
        const url = `${baseUrl.replace(/\/$/, '')}/api/token`;
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
        activeToken = data.token;
        return data.token;
    } catch (error) {
        console.error("Error fetching token:", error);
        return null;
    }
}

export async function fetchStations(limit: number = 20, offset: number = 0): Promise<StationsResponse | null> {
    const baseUrl = import.meta.env.PUBLIC_API_BASE_URL;
    
    // Always ensure we have a token
    const token = await fetchToken();
    if (!token) return null;
    
    // If limit is 0, we just wanted to refresh the token
    if (limit === 0) {
        return { token, stations: [] };
    }
    
    try {
        const url = `${baseUrl.replace(/\/$/, '')}/api/stations?limit=${limit}&offset=${offset}`;
        
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
        const url = `${baseUrl.replace(/\/$/, '')}/api/stations/${id}`;
        
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
