export class SaveSystem {
    constructor() {
        this.key = "HTML_CRAFT_WORLDS";
    }

    getAllWorlds() {
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : [];
    }

    createWorld(name) {
        const worlds = this.getAllWorlds();
        if(!worlds.includes(name)) {
            worlds.push(name);
            localStorage.setItem(this.key, JSON.stringify(worlds));
        }
    }
}
