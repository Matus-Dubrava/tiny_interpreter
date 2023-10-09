export const ObjectType = {
    INTEGER_OBJ: 'INTEGER',
    BOOLEAN_OBJ: 'BOOLEAN',
    NULL_OBJ: 'NULL',
} as const;

export interface IObject {
    getType(): string;
    toString(): string;
}

export class IntObj implements IObject {
    value: number;

    constructor(value: number) {
        this.value = value;
    }

    getType(): string {
        return ObjectType.INTEGER_OBJ;
    }

    toString(): string {
        return `${this.value}`;
    }
}

export class BooleanObj implements IObject {
    value: boolean;

    constructor(value: boolean) {
        this.value = value;
    }

    getType(): string {
        return ObjectType.BOOLEAN_OBJ;
    }

    inspect(): string {
        return `${this.value}`;
    }
}

export class NullObj implements IObject {
    value: null = null;

    getType(): string {
        return ObjectType.NULL_OBJ;
    }

    inspect(): string {
        return 'null';
    }
}
