import { writable } from "svelte/store";

export interface PluginInfo {
    name: string;
    loaded: boolean;
    error?: string;
}

export interface CustomExporter {
    name: string;
    handler: (data: any) => string;
}

export const pluginsStore = writable<PluginInfo[]>([]);
export const customExportersStore = writable<CustomExporter[]>([]);
