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

export async function fetchStations(): Promise<Station[]> {
    const baseUrl = import.meta.env.API_BASE_URL;
    
    try {
        // Since API_BASE_URL might end in a slash or not, we handle it safely
        const url = `${baseUrl.replace(/\/$/, '')}/api/stations`;
        
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`Failed to fetch stations: ${res.statusText}`);
            return [];
        }
        
        const data: Station[] = await res.json();
        return data;
    } catch (error) {
        console.error("Error fetching stations:", error);
        return []; // Return empty array on failure so UI doesn't crash
    }
}
