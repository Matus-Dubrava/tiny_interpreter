import { IObject, IntObj } from '../../object';
import { Lexer } from '../../lexer';
import { Parser } from '../../parser';
import { evaluate } from '..';

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

function testEval(input: string): IObject | null {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    return evaluate(program);
}

function testIntegerObject(obj: IObject, expected: number) {
    expect(obj).toBeInstanceOf(IntObj);
    const intObj = obj as IntObj;
    expect(intObj.value).toEqual(expected);
}
