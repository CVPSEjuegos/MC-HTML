export class SaveSystem {
    constructor() {
        this.prefix = "MCHTML_SAVE_";
    }

    saveWorld(name, data) {
        const blob = btoa(JSON.stringify(data)); // Simulación de formato .MCtx
        localStorage.setItem(this.prefix + name, blob);
        console.log(`Mundo ${name} guardado con éxito.`);
    }

    loadWorld(name) {
        const data = localStorage.getItem(this.prefix + name);
        return data ? JSON.parse(atob(data)) : null;
    }
}
