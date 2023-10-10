import { BooleanObj, IObject, IntObj } from '../../object';
import { Lexer } from '../../lexer';
import { Parser } from '../../parser';
import { evaluate } from '..';

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
    ];

    tests.forEach(({ input, expected }) => {
        const evaluated = testEval(input);
        expect(evaluated).not.toBeNull();
        testIntegerObject(evaluated!, expected);
    });
});

test('test evaluate boolean expression', () => {
    const tests = [
        { input: 'true', expected: true },
        { input: 'false', expected: false },
    ];

    tests.forEach(({ input, expected }) => {
        const evaluated = testEval(input);
        expect(evaluate).not.toBeNull();
        testBooleanObject(evaluated!, expected);
    });
});

function testEval(input: string): IObject | null {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    return evaluate(program);
}

function testBooleanObject(obj: IObject, expected: boolean) {
    expect(obj).toBeInstanceOf(BooleanObj);
    expect((obj as BooleanObj).value).toEqual(expected);
}

function testIntegerObject(obj: IObject, expected: number) {
    expect(obj).toBeInstanceOf(IntObj);
    expect((obj as IntObj).value).toEqual(expected);
}
