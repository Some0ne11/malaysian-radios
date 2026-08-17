const themeToggle = document.getElementById('theme-toggle') as HTMLInputElement;
if (themeToggle) {
    // Check initial state
    if (document.documentElement.classList.contains('dark')) {
        themeToggle.checked = false;
    } else {
        themeToggle.checked = true;
    }
    themeToggle.addEventListener('change', (e) => {
        const isLight = (e.target as HTMLInputElement).checked;
        if (isLight) {
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.add('dark');
        }
    });
}

// Ambient Background & Color Extraction Logic
const ambientContainer = document.getElementById('ambient-bg-container');
const ambientImg = document.getElementById('ambient-bg-img') as HTMLImageElement;

function setDominantColor(imageSrc: string) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);
        
        const data = ctx.getImageData(0, 0, 50, 50).data;
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const pr = data[i];
            const pg = data[i+1];
            const pb = data[i+2];
            const alpha = data[i+3];
            
            if (alpha < 128) continue; // Skip transparent
            
            // Skip white/gray/black pixels to find the true accent
            const max = Math.max(pr, pg, pb);
            const min = Math.min(pr, pg, pb);
            if (max - min < 20 || max > 240 || max < 20) continue; 
            
            r += pr;
            g += pg;
            b += pb;
            count++;
        }
        
        if (count > 0) {
            r = Math.floor(r / count);
            g = Math.floor(g / count);
            b = Math.floor(b / count);
        } else {
            // Fallback if image is entirely grayscale
            const center = ctx.getImageData(25, 25, 1, 1).data;
            r = center[0]; g = center[1]; b = center[2];
        }
        
        // Give it a minimum brightness so the UI isn't completely dark
        if (r < 50 && g < 50 && b < 50) { r = 90; g = 90; b = 100; }
        
        document.documentElement.style.setProperty('--color-primary', `rgb(${r}, ${g}, ${b})`);
    };
}

window.addEventListener('play-station', (e: any) => {
    const logoUrl = e.detail.logo;
    if (logoUrl && ambientContainer && ambientImg) {
        const isProd = import.meta.env.PROD;
        
        // Use Astro's image optimization endpoint for a larger blurred version
        const optimizedUrl = isProd 
            ? `/_vercel/image?url=${encodeURIComponent(logoUrl)}&w=800&q=75`
            : `/_image?href=${encodeURIComponent(logoUrl)}&w=800&h=800&f=webp`;
            
        ambientImg.src = optimizedUrl;
        ambientContainer.classList.remove('opacity-0');
        ambientContainer.classList.add('opacity-100');
        
        // Extract accent color using a tiny optimized version (safe from CORS)
        const tinyUrl = isProd
            ? `/_vercel/image?url=${encodeURIComponent(logoUrl)}&w=64&q=75`
            : `/_image?href=${encodeURIComponent(logoUrl)}&w=50&h=50&f=webp`;
            
        setDominantColor(tinyUrl);
    }
});
