document.querySelectorAll('.radio-card-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.favorite-btn')) return;
        const el = e.currentTarget as HTMLButtonElement;
        const event = new CustomEvent('play-station', {
            detail: {
                id: el.dataset.id,
                name: el.dataset.name,
                category: el.dataset.category,
                logo: el.dataset.logo,
                stream: el.dataset.stream
            }
        });
        window.dispatchEvent(event);
    });
});
