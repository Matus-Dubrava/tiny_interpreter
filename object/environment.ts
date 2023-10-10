import { IObject } from '.';

export class ProgramEnvironment {
    store: Map<string, IObject>;

    constructor() {
        this.store = new Map<string, IObject>();
    }

    set(name: string, value: IObject): void {
        this.store.set(name, value);
    }

    get(name: string): IObject | undefined {
        return this.store.get(name);
    }
}
