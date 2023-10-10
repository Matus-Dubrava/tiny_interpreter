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
