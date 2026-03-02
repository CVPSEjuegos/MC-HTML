export class SaveSystem {
    constructor() {
        this.saveName = "MCHTML_WORLD_ALPHA";
    }

    save(data) {
        localStorage.setItem(this.saveName, JSON.stringify(data));
    }

    load() {
        return JSON.parse(localStorage.getItem(this.saveName));
    }
}
