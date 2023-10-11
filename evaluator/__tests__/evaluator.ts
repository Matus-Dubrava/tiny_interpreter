import {
    BooleanObj,
    ErrorObj,
    FunctionObject,
    IObject,
    IntObj,
    NullObj,
} from '../../object';
import { Lexer } from '../../lexer';
import { Parser } from '../../parser';
import { evaluate } from '..';
import { ProgramEnvironment } from '../../object/environment';

test('test error handling', () => {
    const tests = [
        { input: '5 + true;', expected: 'type mismatch: INTEGER + BOOLEAN' },
        { input: '5 + true; 5;', expected: 'type mismatch: INTEGER + BOOLEAN' },
        { input: '-true', expected: 'unknown operator: -BOOLEAN' },
        {
            input: 'true + false;',
            expected: 'unknown operator: BOOLEAN + BOOLEAN',
        },
        {
            input: '5; true + false; 5',
            expected: 'unknown operator: BOOLEAN + BOOLEAN',
        },
        {
            input: 'if (10 > 1) { true + false; }',
            expected: 'unknown operator: BOOLEAN + BOOLEAN',
        },
        {
            input: `
            132
            if (10 > 1) {
                if (10 > 1) {
                    return true + false;
                }
                return 1;
            }
            `,
            expected: 'unknown operator: BOOLEAN + BOOLEAN',
        },
        {
            input: 'foobar',
            expected: 'identifier not found: foobar',
        },
    ];

    tests.forEach(({ input, expected }) => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();
        testErrorObject(evaluated!, expected);
    });
});

test('test evaluate function expression', () => {
    const input = 'fn(x) { x + 2; };';

    const evaluated = testEval(input);
    expect(evaluated).not.toBeNull();
    expect(evaluated).toBeInstanceOf(FunctionObject);
    const fn = evaluated as FunctionObject;
    expect(fn.params.length).toEqual(1);
    expect(fn.params[0].toString()).toEqual('x');
    expect(fn.body.toString()).toEqual('(x + 2)');
});

test('test function application', () => {
    const tests = [
        { input: 'let identity = fn(x) { x; }; identity(5);', expected: 5 },
        {
            input: 'let identity = fn(x) { return x; }; identity(5);',
            expected: 5,
        },
        { input: 'let double = fn(x) { x * 2; }; double(5);', expected: 10 },
        { input: 'let add = fn(x, y) { x + y; }; add(5, 5);', expected: 10 },
        {
            input: 'let add = fn(x, y) { x + y; }; add(5 + 5, add(5, 5));',
            expected: 20,
        },
        { input: 'fn(x) { x; }(5)', expected: 5 },
        {
            input: `
                let a = fn(x) { let b = x; b + 1; };
                a(1);
            `,
            expected: 2,
        },
    ];

    tests.forEach(({ input, expected }) => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();
        testIntegerObject(evaluated!, expected);
    });
});

test('test closures', () => {
    const input = `
        let newAdder = fn(x) {
            fn(y) { x + y };
        };
        let addTwo = newAdder(2);
        addTwo(2);
    `;

    const evaluated = testEval(input);
    expect(evaluated).not.toBeNull();
    testIntegerObject(evaluated!, 4);
});

test('test recursive functions', () => {
    let input = `
        let factorial = fn(n) { if (n <= 1) {1} else { factorial(n-1) * n} };
        factorial(5);
    `;

    let evaluated = testEval(input);
    expect(evaluated).not.toBeNull();
    testIntegerObject(evaluated!, 120);

    input = `
        let fibonacci = fn(n) {
            if (n < 2) {
                n
            } else {
                fibonacci(n - 1) + fibonacci(n - 2)
            }
        };
        fibonacci(15);
    `;

    evaluated = testEval(input);
    expect(evaluated).not.toBeNull();
    testIntegerObject(evaluated!, 610);
});

test('test evaluate let statement', () => {
    const tests = [
        { input: 'let a = 5; a;', expected: 5 },
        { input: 'let a = 5 * 5; a;', expected: 25 },
        { input: 'let a = 5; let b = a; b;', expected: 5 },
        { input: 'let a = 5; let b = a; let c = a + b + 5; c;', expected: 15 },
    ];

    tests.forEach(({ input, expected }) => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();
        testIntegerObject(evaluated!, expected);
    });
});

test('test evaluate return statement', () => {
    const tests = [
        { input: 'return 10;', expected: 10 },
        { input: 'return 10; 9;', expected: 10 },
        { input: 'return 2 * 5; 9;', expected: 10 },
        { input: '9; return 2 * 5; 9;', expected: 10 },
        {
            input: `
                if (10 > 1) {
                    if (10 > 1) {
                        return 10;
                    }
                    129
                    return 1;
                }`,
            expected: 10,
        },
        {
            input: `
                if (10 > 1) {
                    if (10 > 1) {
                        if (10 > 1) {
                            return 10;
                        }
                    }
                    129
                    return 1;
                }`,
            expected: 10,
        },
    ];

    tests.forEach(({ input, expected }) => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();
        testIntegerObject(evaluated!, expected);
    });
});

test('test evaluate prefix expression', () => {
    const tests = [
        { input: '!true', expected: false },
        { input: '!false', expected: true },
        { input: '!5', expected: false },
        { input: '!!true', expected: true },
        { input: '!!false', expected: false },
        { input: '!!5', expected: true },
    ];

    tests.forEach(({ input, expected }) => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();
        testBooleanObject(evaluated!, expected);
    });
});

test('test evaluate integer expression', () => {
    const tests = [
        { input: '5', expected: 5 },
        { input: '9999', expected: 9999 },
        { input: '0', expected: 0 },
        { input: '-1', expected: -1 },
        { input: '-0', expected: 0 },
        { input: '5 + 5 + 5 + 5 - 10', expected: 10 },
        { input: '2 * 2 * 2 * 2 * 2', expected: 32 },
        { input: '-50 + 100 + -50', expected: 0 },
        { input: '5 * 2 + 10', expected: 20 },
        { input: '5 + 2 * 10', expected: 25 },
        { input: '20 + 2 * -10', expected: 0 },
        { input: '50 / 2 * 2 + 10', expected: 60 },
        { input: '2 * (5 + 10)', expected: 30 },
        { input: '3 * 3 * 3 + 10', expected: 37 },
        { input: '3 * (3 * 3) + 10', expected: 37 },
        { input: '(5 + 10 * 2 + 15 / 3) * 2 + -10', expected: 50 },
        { input: '10 % 2', expected: 0 },
        { input: '10 % 3', expected: 1 },
        { input: '0 % 2', expected: 0 },
    ];

    tests.forEach(({ input, expected }) => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();
        testIntegerObject(evaluated!, expected);
    });
});

test('test evaluate infix boolean expression', () => {
    const tests = [
        { input: 'true', expected: true },
        { input: 'false', expected: false },
        { input: 'true && true', expected: true },
        { input: 'true && false', expected: false },
        { input: 'true && false', expected: false },
        { input: 'false && false', expected: false },
        { input: 'true || true', expected: true },
        { input: 'true || false', expected: true },
        { input: 'true || false', expected: true },
        { input: 'false || false', expected: false },
        { input: 'true', expected: true },
        { input: 'false', expected: false },
        { input: '1 < 2', expected: true },
        { input: '1 > 2', expected: false },
        { input: '1 < 1', expected: false },
        { input: '1 > 1', expected: false },
        { input: '1 >= 1', expected: true },
        { input: '1 >= 2', expected: false },
        { input: '1 <= 1', expected: true },
        { input: '1 <= 0', expected: false },
        { input: '1 == 1', expected: true },
        { input: '1 != 1', expected: false },
        { input: '1 == 2', expected: false },
        { input: '1 != 2', expected: true },
        { input: 'true == true', expected: true },
        { input: 'true != true', expected: false },
        { input: 'true != false', expected: true },
        { input: 'true == false', expected: false },
        { input: '(1 < 2) == true', expected: true },
        { input: '(1 < 2) == false', expected: false },
        { input: '(1 > 2) == true', expected: false },
        { input: '(1 > 2) == false', expected: true },
    ];

    tests.forEach(({ input, expected }) => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();
        testBooleanObject(evaluated!, expected);
    });
});

test('test evaluate if/else expression', () => {
    const tests = [
        { input: 'if (true) { 10 }', expected: 10 },
        { input: 'if (false) { 10 }', expected: null },
        { input: 'if (1) { 10 }', expected: 10 },
        { input: 'if (1 < 2) { 10 }', expected: 10 },
        { input: 'if (1 > 2) { 10 }', expected: null },
        { input: 'if (1 > 2) { 10 } else { 20 }', expected: 20 },
        { input: 'if (1 < 2) { 10 } else { 20 }', expected: 10 },
    ];

    tests.forEach(({ input, expected }) => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();
        if (evaluated instanceof IntObj) {
            testIntegerObject(evaluated, expected!);
        } else {
            testNullObject(evaluated!);
        }
    });
});

function testEval(input: string): IObject | null {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    expect(parser.errors.length).toEqual(0);
    const env = new ProgramEnvironment();
    return evaluate(program, env);
}

function testErrorObject(obj: IObject, expected: string): void {
    expect(obj).toBeInstanceOf(ErrorObj);
    expect((obj as ErrorObj).value).toEqual(expected);
}

function testNullObject(obj: IObject): void {
    expect(obj).toBeInstanceOf(NullObj);
}

function testBooleanObject(obj: IObject, expected: boolean): void {
    expect(obj).toBeInstanceOf(BooleanObj);
    expect((obj as BooleanObj).value).toEqual(expected);
}

function testIntegerObject(obj: IObject, expected: number): void {
    expect(obj).toBeInstanceOf(IntObj);
    expect((obj as IntObj).value).toEqual(expected);
}
