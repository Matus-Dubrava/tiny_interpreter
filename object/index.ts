import { BlockStatement, IExpression, Identifier } from '../ast';
import { ProgramEnvironment } from './environment';

export const ObjectType = {
    INTEGER_OBJ: 'INTEGER',
    BOOLEAN_OBJ: 'BOOLEAN',
    NULL_OBJ: 'NULL',
    ERROR_OBJ: 'ERROR',
    RETURN_OBJ: 'RETURN',
    FUNCTION_OBJ: 'FUNCTION',
    STRING_OBJ: 'STRING',
    BUILTIN_OBJ: 'BUILTIN',
    ARRAY_OBJ: 'ARRAY',
    HASH_OBJ: 'HASH',
    BREAK_OBJ: 'BREAK',
} as const;

export type ObjectType = (typeof ObjectType)[keyof typeof ObjectType];
export type BuilinFunction = (...args: IObject[]) => IObject;

export interface IObject {
    getType(): ObjectType;
    toString(): string;
    isHashable(): boolean;
    getHash(): string;
}

export type HashPair = {
    key: IObject;
    value: IObject;
};

export class HashObj implements IObject {
    pairs: Map<string, HashPair>;

    constructor(pairs: Map<string, HashPair>) {
        this.pairs = pairs;
    }

    getType(): ObjectType {
        return ObjectType.HASH_OBJ;
    }

    toString(): string {
        const res: string[] = [];

        for (const [key, value] of this.pairs) {
            res.push(`${value.key.toString()}: ${value.value.toString()}`);
        }

        return `{${res.join(', ')}}`;
    }

    isHashable(): boolean {
        return false;
    }

    getHash(): string {
        return '';
    }
}

export class BreakObj implements IObject {
    getType(): ObjectType {
        return ObjectType.BREAK_OBJ;
    }

    toString(): string {
        return 'break';
    }

    isHashable(): boolean {
        return false;
    }

    getHash(): string {
        return '';
    }
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

    isHashable(): boolean {
        return true;
    }

    getHash(): string {
        return this.value.toString();
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

    isHashable(): boolean {
        return true;
    }

    getHash(): string {
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

    isHashable(): boolean {
        return true;
    }

    getHash(): string {
        return this.value.toString();
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

    isHashable(): boolean {
        return false;
    }

    getHash(): string {
        return '';
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

    isHashable(): boolean {
        return false;
    }

    getHash(): string {
        return '';
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

    isHashable(): boolean {
        return false;
    }

    getHash(): string {
        return '';
    }
}

export class ReturnObj implements IObject {
    value: IObject;

    constructor(value: IObject) {
        this.value = value;
    }

    getType(): ObjectType {
        return ObjectType.RETURN_OBJ;
    }

    toString(): string {
        return this.value.toString();
    }

    isHashable(): boolean {
        return false;
    }

    getHash(): string {
        return '';
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

    isHashable(): boolean {
        return false;
    }

    getHash(): string {
        return '';
    }
}

export class ArrayObj implements IObject {
    elements: IObject[];

    constructor(elements: IObject[]) {
        this.elements = elements;
    }

    getType(): ObjectType {
        return ObjectType.ARRAY_OBJ;
    }
    toString(): string {
        return `[${this.elements.map((el) => el.toString()).join(', ')}]`;
    }

    isHashable(): boolean {
        return false;
    }

    getHash(): string {
        return '';
    }
}

export const TRUE = new BooleanObj(true);
export const FALSE = new BooleanObj(false);
export const NULL = new NullObj();
