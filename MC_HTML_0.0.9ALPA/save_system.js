export class SaveSystem {
    constructor() {
        this.storageKey = "MCHTML_WORLDS";
    }

    getWorlds() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    saveNewWorld(name) {
        const worlds = this.getWorlds();
        if(!worlds.find(w => w.name === name)) {
            worlds.push({ name: name, seed: Math.floor(Math.random() * 999999) });
            localStorage.setItem(this.storageKey, JSON.stringify(worlds));
        }
    }
}
