import { BlockStatement, Identifier } from '../ast';
import { ProgramEnvironment } from './environment';

export const ObjectType = {
    INTEGER_OBJ: 'INTEGER',
    BOOLEAN_OBJ: 'BOOLEAN',
    NULL_OBJ: 'NULL',
    ERROR_OBJ: 'ERROR',
    RETUNR_OBJ: 'RETURN',
    FUNCTION_OBJ: 'FUNCTION',
    STRING_OBJ: 'STRING',
    BUILTIN_OBJ: 'BUILTIN',
} as const;

export type ObjectType = (typeof ObjectType)[keyof typeof ObjectType];
export type BuilinFunction = (...args: IObject[]) => IObject;

export interface IObject {
    getType(): ObjectType;
    toString(): string;
}

export class IntObj implements IObject {
    value: number;

    constructor(value: number) {
        this.value = value;
    }

    getType(): ObjectType {
        return ObjectType.INTEGER_OBJ;
    }

    toString(): string {
        return `${this.value}`;
    }
}

export class StringObj implements IObject {
    value: string;

    constructor(value: string) {
        this.value = value;
    }

    getType(): ObjectType {
        return ObjectType.STRING_OBJ;
    }

    toString(): string {
        return this.value;
    }
}

export class BooleanObj implements IObject {
    value: boolean;

    constructor(value: boolean) {
        this.value = value;
    }

    getType(): ObjectType {
        return ObjectType.BOOLEAN_OBJ;
    }

    toString(): string {
        return `${this.value}`;
    }
}

export class NullObj implements IObject {
    value: null = null;

    getType(): ObjectType {
        return ObjectType.NULL_OBJ;
    }

    toString(): string {
        return 'null';
    }
}

export class BuiltinObj implements IObject {
    fn: BuilinFunction;

    constructor(fn: BuilinFunction) {
        this.fn = fn;
    }

    getType(): ObjectType {
        return ObjectType.BUILTIN_OBJ;
    }

    toString(): string {
        return 'builtin function';
    }
}

export class ErrorObj implements IObject {
    value: string;

    constructor(value: string) {
        this.value = value;
    }

    getType(): ObjectType {
        return ObjectType.ERROR_OBJ;
    }

    toString(): string {
        return `ERROR: ${this.value}`;
    }
}

export class ReturnObj implements IObject {
    value: IObject;

    constructor(value: IObject) {
        this.value = value;
    }

    getType(): ObjectType {
        return ObjectType.RETUNR_OBJ;
    }

    toString(): string {
        return this.value.toString();
    }
}

export class FunctionObject implements IObject {
    params: Identifier[];
    body: BlockStatement;
    env: ProgramEnvironment;

    constructor(
        params: Identifier[],
        body: BlockStatement,
        env: ProgramEnvironment
    ) {
        this.params = params;
        this.body = body;
        this.env = env;
    }

    getType(): ObjectType {
        return ObjectType.FUNCTION_OBJ;
    }

    toString(): string {
        return `fn(${this.params
            .map((param) => param.toString())
            .join(', ')}) {\n${this.body.toString()}}\n`;
    }
}

export const TRUE = new BooleanObj(true);
export const FALSE = new BooleanObj(false);
export const NULL = new NullObj();
