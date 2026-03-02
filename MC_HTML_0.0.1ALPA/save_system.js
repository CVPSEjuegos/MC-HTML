export const SaveSystem = {
    saveWorld(name) {
        const data = { name, seed: Math.random(), date: new Date().toLocaleDateString() };
        const encrypted = btoa(JSON.stringify(data));
        localStorage.setItem(`mundo_${name}.MCtx`, encrypted);
    },
    getAll() {
        return Object.keys(localStorage)
            .filter(k => k.endsWith('.MCtx'))
            .map(k => JSON.parse(atob(localStorage.getItem(k))));
    }
};