export const ObjectType = {
    INTEGER_OBJ: 'INTEGER',
    BOOLEAN_OBJ: 'BOOLEAN',
    NULL_OBJ: 'NULL',
    ERROR_OBJ: 'ERROR',
    RETUNR_OBJ: 'RETURN',
} as const;

type ObjectTypeItem = (typeof ObjectType)[keyof typeof ObjectType];

export interface IObject {
    getType(): ObjectTypeItem;
    toString(): string;
}

export class IntObj implements IObject {
    value: number;

    constructor(value: number) {
        this.value = value;
    }

    getType(): ObjectTypeItem {
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

    getType(): ObjectTypeItem {
        return ObjectType.BOOLEAN_OBJ;
    }

    toString(): string {
        return `${this.value}`;
    }
}

export class NullObj implements IObject {
    value: null = null;

    getType(): ObjectTypeItem {
        return ObjectType.NULL_OBJ;
    }

    toString(): string {
        return 'null';
    }
}

export class ErrorObj implements IObject {
    value: string;

    constructor(value: string) {
        this.value = value;
    }

    getType(): ObjectTypeItem {
        return ObjectType.ERROR_OBJ;
    }

    toString(): string {
        return this.value;
    }
}

export class ReturnObj implements IObject {
    value: IObject;

    constructor(value: IObject) {
        this.value = value;
    }

    getType(): ObjectTypeItem {
        return ObjectType.RETUNR_OBJ;
    }

    toString(): string {
        return this.value.toString();
    }
}
