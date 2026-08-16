let toastTimeout: number | null = null;

export function showToast(message: string) {
    const toast = document.getElementById('radio-toast');
    const msgEl = document.getElementById('radio-toast-message');
    
    if (!toast || !msgEl) return;
    
    // Clear any existing timeout if a new toast comes in quickly
    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }
    
    msgEl.textContent = message;
    
    // Slide in
    toast.classList.remove('translate-y-20', 'opacity-0');
    
    // Slide out after 3 seconds
    toastTimeout = window.setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}
