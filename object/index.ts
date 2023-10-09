type ObjectType = string;

const INTEGER_OBJ = 'INTEGER';
const BOOLEAN_OBJ = 'BOOLEAN';
const NULL_OBJ = 'NULL';

interface IObject {
    getType(): ObjectType;
    inspect(): string;
}

class IntObj implements IObject {
    value: number;

    constructor(value: number) {
        this.value = value;
    }

    getType(): string {
        return INTEGER_OBJ;
    }

    inspect(): string {
        return `${this.value}`;
    }
}

class BooleanObj implements IObject {
    value: boolean;

    constructor(value: boolean) {
        this.value = value;
    }

    getType(): string {
        return BOOLEAN_OBJ;
    }

    inspect(): string {
        return `${this.value}`;
    }
}

class NullObj implements IObject {
    value: null = null;

    getType(): string {
        return NULL_OBJ;
    }

    inspect(): string {
        return 'null';
    }
}
