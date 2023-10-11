import { IObject } from '.';

export class ProgramEnvironment {
    store: Map<string, IObject>;
    outer: ProgramEnvironment | null = null;

    constructor() {
        this.store = new Map<string, IObject>();
    }

    set(name: string, value: IObject): void {
        this.store.set(name, value);
    }

    get(name: string): IObject | undefined {
        let obj = this.store.get(name);
        if (!obj && this.outer) {
            obj = this.outer.get(name);
        }
        return obj;
    }
}

export function createEnclosedEnvironment(
    outer: ProgramEnvironment
): ProgramEnvironment {
    const env = new ProgramEnvironment();
    env.outer = outer;
    return env;
}
