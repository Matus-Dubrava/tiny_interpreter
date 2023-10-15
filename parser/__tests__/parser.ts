import { Lexer, TokenType } from '../../lexer';
import {
    IExpression,
    LoopExpression,
    IStatement,
    Let,
    Return,
    ExpressionStatement,
    IntLiteral,
    PrefixExpression,
    InfixExpression,
    Identifier,
    BooleanLiteral,
    IfExpression,
    FunctionLiteral,
    CallExpression,
    StringLiteral,
    ArrayLiteral,
    IndexExpression,
    ImportStatement,
    ExitStatement,
    HashLiteral,
    BreakStatement,
} from '../../ast';
import { Parser } from '../index';

test('test operator precendece', () => {
    const tests = [
        { input: '-a * b', expected: '((-a) * b)' },
        { input: '!-a', expected: '(!(-a))' },
        { input: 'a + b + c', expected: '((a + b) + c)' },
        { input: 'a + b - c', expected: '((a + b) - c)' },
        { input: 'a * b * c', expected: '((a * b) * c)' },
        { input: 'a * b / c', expected: '((a * b) / c)' },
        { input: 'a + b / c', expected: '(a + (b / c))' },
        {
            input: 'a + b * c + d / e - f',
            expected: '(((a + (b * c)) + (d / e)) - f)',
        },
        { input: '3 + 4; -5 * 5', expected: '(3 + 4); ((-5) * 5)' },
        { input: '5 > 4 == 3 < 4', expected: '((5 > 4) == (3 < 4))' },
        { input: '5 < 4 != 3 > 4', expected: '((5 < 4) != (3 > 4))' },
        {
            input: '3 + 4 * 5 == 3 * 1 + 4 * 5',
            expected: '((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))',
        },
        {
            input: 'true && true == false || false',
            expected: '((true && (true == false)) || false)',
        },
        {
            input: 'true || true && false || false',
            expected: '((true || (true && false)) || false)',
        },
        {
            input: '1 > 2 && 3 < 4 || 5 > 6 && 7 < 8',
            expected: '(((1 > 2) && (3 < 4)) || ((5 > 6) && (7 < 8)))',
        },
        {
            input: '3 > 5 == false',
            expected: '((3 > 5) == false)',
        },
        {
            input: '3 < 5 == true',
            expected: '((3 < 5) == true)',
        },
        {
            input: '1 + (2 + 3) + 4',
            expected: '((1 + (2 + 3)) + 4)',
        },
        {
            input: '(5 + 5) * 2',
            expected: '((5 + 5) * 2)',
        },
        {
            input: '2 / (5 + 5)',
            expected: '(2 / (5 + 5))',
        },
        {
            input: '-(5 + 5)',
            expected: '(-(5 + 5))',
        },
        {
            input: '!(true == true)',
            expected: '(!(true == true))',
        },
        {
            input: 'a + add(b * c) + d',
            expected: '((a + add((b * c))) + d)',
        },
        {
            input: 'add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8))',
            expected: 'add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)))',
        },
        {
            input: 'add(a + b + c * d / f + g)',
            expected: 'add((((a + b) + ((c * d) / f)) + g))',
        },
        {
            input: 'a * [1, 2, 3, 4][b * c] * d',
            expected: '((a * ([1, 2, 3, 4][(b * c)])) * d)',
        },
        {
            input: 'add(a * b[2], b[1], 2 * [1, 2][1])',
            expected: 'add((a * (b[2])), (b[1]), (2 * ([1, 2][1])))',
        },
    ];

    tests.forEach(({ input, expected }) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParseErrors(parser);
        expect(program.toString()).toEqual(expected);
    });
});

test('test parse loop expression', () => {
    const input = `
        loop {
            1 + 2;
            break;
        }
        let x = 5;
    `;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);
    expect(program.stmts.length).toEqual(2);
    const expr = getExpression(program.stmts[0]);
    expect(expr).toBeInstanceOf(LoopExpression);

    const loopExpr = expr as LoopExpression;
    expect(loopExpr.body.stmts.length).toEqual(2);

    const firstStmt = loopExpr.body.stmts[0];
    expect(firstStmt).toBeInstanceOf(ExpressionStatement);
    const firstExpr = (firstStmt as ExpressionStatement).expr;
    testInfixExpression(firstExpr, 1, '+', 2);

    const secondStmt = loopExpr.body.stmts[1];
    expect(secondStmt).toBeInstanceOf(BreakStatement);
});

test('test parse loop expression with return statement', () => {
    const input = `
        let i = 0;
        loop {
            if (i > 10) {
                return i;
            }
            let i = i + 1;
        }
    `;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);
    expect(program.stmts.length).toEqual(2);
    const expr = getExpression(program.stmts[1]);
    expect(expr).toBeInstanceOf(LoopExpression);
});

test('test parse array literal', () => {
    const input = '[1, 2 * 2, 3 + 3]';

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);
    expect(program.stmts.length).toEqual(1);

    const expr = getExpression(program.stmts[0]);
    expect(expr).toBeInstanceOf(ArrayLiteral);
    const array = expr as ArrayLiteral;
    expect(array.elements.length).toEqual(3);

    testIntExpr(array.elements[0], 1);
    testInfixExpression(array.elements[1], 2, '*', 2);
    testInfixExpression(array.elements[2], 3, '+', 3);
});

test('test parse index expression', () => {
    const input = 'arr[10 * 10]';

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);
    expect(program.stmts.length).toEqual(1);

    const expr = getExpression(program.stmts[0]);
    expect(expr).toBeInstanceOf(IndexExpression);
    const indexExpr = expr as IndexExpression;
    testIdentifier(indexExpr.left, 'arr');
    testInfixExpression(indexExpr.index, 10, '*', 10);
});

test('test parse call expression', () => {
    const input = 'add(1, 2 * 3, 4 + 5);';

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);

    expect(program.stmts.length).toEqual(1);
    const expr = getExpression(program.stmts[0]);
    expect(expr).toBeInstanceOf(CallExpression);
    const callExpr = expr as CallExpression;

    testIdentifier(callExpr.func, 'add');
    expect(callExpr.args.length).toEqual(3);
    testIntExpr(callExpr.args[0], 1);
    testInfixExpression(callExpr.args[1], 2, '*', 3);
    testInfixExpression(callExpr.args[2], 4, '+', 5);
});

test('test parse call expression without arguments', () => {
    const input = 'add()';

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);

    expect(program.stmts.length).toEqual(1);
    const expr = getExpression(program.stmts[0]);
    expect(expr).toBeInstanceOf(CallExpression);
    const callExpr = expr as CallExpression;
    expect(callExpr.args.length).toEqual(0);
});

test('test parse call expression with function literal', () => {
    const input = 'fn(x){x + 1}(1);';

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);

    expect(program.stmts.length).toEqual(1);
    const expr = getExpression(program.stmts[0]);
    expect(expr).toBeInstanceOf(CallExpression);
    const callExpr = expr as CallExpression;

    expect(callExpr.args.length).toEqual(1);
    testIntExpr(callExpr.args[0], 1);

    expect(callExpr.func).toBeInstanceOf(FunctionLiteral);
    const fnLiteral = callExpr.func as FunctionLiteral;
    expect(fnLiteral.parameters.length).toEqual(1);
    testIdentifier(fnLiteral.parameters[0], 'x');

    expect(fnLiteral.body.stmts.length).toEqual(1);
    const bodyExpr = getExpression(fnLiteral.body.stmts[0]);
    testInfixExpression(bodyExpr, 'x', '+', 1);
});

test('test parse function literal', () => {
    const input = `fn(x, y) { x + y; }`;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);

    expect(program.stmts.length).toEqual(1);
    const expr = getExpression(program.stmts[0]);
    expect(expr).toBeInstanceOf(FunctionLiteral);
    const fnExpr = expr as FunctionLiteral;

    expect(fnExpr.parameters.length).toEqual(2);
    testIdentifier(fnExpr.parameters[0], 'x');
    testIdentifier(fnExpr.parameters[1], 'y');

    expect(fnExpr.body.stmts.length).toEqual(1);
});

test('test parse function literal containing if expression', () => {
    const input = `
        fn(x, y) { if (true) { 1 } else { 2 } }
        x(1, 2);
    `;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);
    expect(program.stmts.length).toEqual(2);
});

test('test parse string literal', () => {
    const input = `"Hello world!"`;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);
    expect(program.stmts.length).toEqual(1);

    const expr = getExpression(program.stmts[0]);
    expect(expr).toBeInstanceOf(StringLiteral);
    expect((expr as StringLiteral).value).toEqual('Hello world!');
});

test('test parse infix string operations', () => {
    const input = `"hello" + "world"`;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);
    expect(program.stmts.length).toEqual(1);

    const expr = getExpression(program.stmts[0]);
    expect(expr).toBeInstanceOf(InfixExpression);
    const infixExpr = expr as InfixExpression;
    expect(infixExpr.operator).toEqual('+');
    expect(infixExpr.left).toBeInstanceOf(StringLiteral);
    expect((infixExpr.left as StringLiteral).value).toEqual('hello');
    expect(infixExpr.right).toBeInstanceOf(StringLiteral);
    expect((infixExpr.right as StringLiteral).value).toEqual('world');
});

test('test parse if expression', () => {
    const input = 'if (x < y) { x }';

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);

    expect(program.stmts.length).toEqual(1);
    expect(program.stmts[0]).toBeInstanceOf(ExpressionStatement);
    const expr = (program.stmts[0] as ExpressionStatement).expr;
    expect(expr).toBeInstanceOf(IfExpression);
    const ifExpr = expr as IfExpression;
    testInfixExpression(ifExpr.condition, 'x', '<', 'y');
    expect(ifExpr.consequence.stmts.length).toEqual(1);
    expect(ifExpr.consequence.stmts[0]).toBeInstanceOf(ExpressionStatement);
    const consequenceExpr = (ifExpr.consequence.stmts[0] as ExpressionStatement)
        .expr;
    testIdentifier(consequenceExpr, 'x');
});

test('test parse if expression with consequence', () => {
    const input = `if (x == y) { x; y; } else { return y + 1; }`;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);

    expect(program.stmts.length).toEqual(1);
    const expr = getExpression(program.stmts[0]);
    expect(expr).toBeInstanceOf(IfExpression);
    const ifExpr = expr as IfExpression;

    testInfixExpression(ifExpr.condition, 'x', '==', 'y');

    expect(ifExpr.consequence.stmts.length).toEqual(2);
    expect(ifExpr.alternative).not.toBeNull();
    expect(ifExpr.alternative?.stmts.length).toEqual(1);
});

test('test parse list of parameters', () => {
    const tests = [
        { input: '()', expectedLen: 0, expectedList: [] },
        { input: '(x)', expectedLen: 1, expectedList: ['x'] },
        { input: '(x, y)', expectedLen: 2, expectedList: ['x', 'y'] },
        {
            input: '(x, y, foobar)',
            expectedLen: 3,
            expectedList: ['x', 'y', 'foobar'],
        },
    ];

    tests.forEach(({ input, expectedLen, expectedList }) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const parameters = parser.parseListOfParameters();

        expect(parameters).not.toBeNull();
        expect(parameters?.length).toBe(expectedLen);
        parameters?.forEach((param, i) => {
            testIdentifier(param, expectedList[i]);
        });
    });
});

test('test parse infix expression', () => {
    const tests = [
        {
            input: '5 + 5;',
            expectedLeftValue: 5,
            expectedOperator: '+',
            expectedRightValue: 5,
        },
        {
            input: '5 - 5;',
            expectedLeftValue: 5,
            expectedOperator: '-',
            expectedRightValue: 5,
        },
        {
            input: '5 * 5;',
            expectedLeftValue: 5,
            expectedOperator: '*',
            expectedRightValue: 5,
        },
        {
            input: '5 / 5;',
            expectedLeftValue: 5,
            expectedOperator: '/',
            expectedRightValue: 5,
        },
        {
            input: '5 > 5;',
            expectedLeftValue: 5,
            expectedOperator: '>',
            expectedRightValue: 5,
        },
        {
            input: '5 < 5;',
            expectedLeftValue: 5,
            expectedOperator: '<',
            expectedRightValue: 5,
        },
        {
            input: '5 == 5;',
            expectedLeftValue: 5,
            expectedOperator: '==',
            expectedRightValue: 5,
        },
        {
            input: '5 != 5;',
            expectedLeftValue: 5,
            expectedOperator: '!=',
            expectedRightValue: 5,
        },
        {
            input: 'true == true;',
            expectedLeftValue: true,
            expectedOperator: '==',
            expectedRightValue: true,
        },
        {
            input: 'true != false;',
            expectedLeftValue: true,
            expectedOperator: '!=',
            expectedRightValue: false,
        },
        {
            input: 'false && false;',
            expectedLeftValue: false,
            expectedOperator: '&&',
            expectedRightValue: false,
        },
        {
            input: 'true || false;',
            expectedLeftValue: true,
            expectedOperator: '||',
            expectedRightValue: false,
        },
    ];

    tests.forEach(
        ({
            input,
            expectedLeftValue,
            expectedOperator,
            expectedRightValue,
        }) => {
            const lexer = new Lexer(input);
            const parser = new Parser(lexer);
            const program = parser.parseProgram();
            checkParseErrors(parser);
            expect(program.stmts.length).toEqual(1);

            const expr = getExpression(program.stmts[0]);
            testInfixExpression(
                expr,
                expectedLeftValue,
                expectedOperator,
                expectedRightValue
            );
        }
    );
});

test('test parse prefix expression', () => {
    const tests = [
        { input: '!5', expectedOperator: '!', expectedIntValue: 5 },
        { input: '-999', expectedOperator: '-', expectedIntValue: 999 },
        { input: '!0;', expectedOperator: '!', expectedIntValue: 0 },
        { input: '!true;', expectedOperator: '!', expectedIntValue: true },
        { input: '!false;', expectedOperator: '!', expectedIntValue: false },
    ];

    tests.forEach(({ input, expectedOperator, expectedIntValue }) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParseErrors(parser);
        expect(program.stmts.length).toEqual(1);
        const prefixExpr = getExpression(program.stmts[0]);
        testPrefixExpression(prefixExpr, expectedOperator, expectedIntValue);
    });
});

test('test parse multiple statemenets', () => {
    const input = `
        let x = 5;
        return 1;
        let y = 3;
        return 15;
    `;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);

    expect(program.stmts.length).toEqual(4);
    expect((program.stmts[0] as Let).token.type).toEqual(TokenType.Let);
    expect((program.stmts[1] as Let).token.type).toEqual(TokenType.Return);
    expect((program.stmts[2] as Let).token.type).toEqual(TokenType.Let);
    expect((program.stmts[3] as Let).token.type).toEqual(TokenType.Return);
});

test('test parse let statement', () => {
    const tests = [
        { input: 'let x = 5;', expectedName: 'x', expectedIntValue: 5 },
        { input: 'let x = 5', expectedName: 'x', expectedIntValue: 5 },
        { input: 'let y = 1;', expectedName: 'y', expectedIntValue: 1 },
        {
            input: 'let something = 5;',
            expectedName: 'something',
            expectedIntValue: 5,
        },
    ];

    tests.forEach(({ input, expectedName, expectedIntValue }) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParseErrors(parser);

        expect(program.stmts.length).toEqual(1);
        expect(program.stmts[0]).toBeInstanceOf(Let);
        const letStmt = program.stmts[0] as Let;
        expect(letStmt.token.type).toEqual(TokenType.Let);
        expect(letStmt.ident.name).toEqual(expectedName);
        testIntExpr(letStmt.expr, expectedIntValue);
    });
});

test('test parse return statement', () => {
    const input = 'return 5;';

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);

    expect(program.stmts.length).toEqual(1);
    expect((program.stmts[0] as Return).token.type).toEqual(TokenType.Return);
});

test('test parse simple import statement', () => {
    const input = `import "../somefile.tn"`;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);
    expect(program.stmts.length).toEqual(1);
    expect(program.stmts[0]).toBeInstanceOf(ImportStatement);
    const importStmt = program.stmts[0] as ImportStatement;
    testStringLiteral(importStmt.fileName, '../somefile.tn');
});

test('test parse hash stamement with string keys', () => {
    const input = `{ "one": 1, "two": 2, "three": 3 }`;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);
    expect(program.stmts.length).toEqual(1);

    const expr = getExpression(program.stmts[0]);
    expect(expr).toBeInstanceOf(HashLiteral);
    const hashStmt = expr as HashLiteral;
    expect(hashStmt.pairs.size).toEqual(3);

    const expected = new Map<string, number>();
    expected.set('one', 1);
    expected.set('two', 2);
    expected.set('three', 3);

    for (const [key, value] of hashStmt.pairs) {
        expect(key).toBeInstanceOf(StringLiteral);
        const expectedValue = expected.get((key as StringLiteral).value);
        expect(expectedValue).toBeDefined();
        testIntExpr(value as IntLiteral, expectedValue!);
    }
});

test('test parse hash stamement with integer keys', () => {
    const input = `{ 1: 1, 2: 2, 3: 3 }`;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);
    expect(program.stmts.length).toEqual(1);

    const expr = getExpression(program.stmts[0]);
    expect(expr).toBeInstanceOf(HashLiteral);
    const hashStmt = expr as HashLiteral;
    expect(hashStmt.pairs.size).toEqual(3);

    const expected = new Map<string, number>();
    expected.set('1', 1);
    expected.set('2', 2);
    expected.set('3', 3);

    for (const [key, value] of hashStmt.pairs) {
        expect(key).toBeInstanceOf(IntLiteral);
        const expectedValue = expected.get(
            (key as IntLiteral).value.toString()
        );
        expect(expectedValue).toBeDefined();
        testIntExpr(value as IntLiteral, expectedValue!);
    }
});

test('test parse empty hash statement', () => {
    const input = '{}';

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);
    expect(program.stmts.length).toEqual(1);

    const expr = getExpression(program.stmts[0]);
    expect(expr).toBeInstanceOf(HashLiteral);
    const hashStmt = expr as HashLiteral;
    expect(hashStmt.pairs.entries.length).toEqual(0);
});

test('test parse exit statement', () => {
    const input = 'exit 100';

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);
    expect(program.stmts.length).toEqual(1);
    expect(program.stmts[0]).toBeInstanceOf(ExitStatement);
    testIntExpr((program.stmts[0] as ExitStatement).exitCode, 100);
});

test('test parse import statements', () => {
    const input = `
        import "../somefile.tn"
        import "utils.tn"
        
        return 1;
    `;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);
    expect(program.stmts.length).toEqual(3);

    expect(program.stmts[0]).toBeInstanceOf(ImportStatement);
    const importStmt1 = program.stmts[0] as ImportStatement;
    testStringLiteral(importStmt1.fileName, '../somefile.tn');

    expect(program.stmts[1]).toBeInstanceOf(ImportStatement);
    const importStmt2 = program.stmts[1] as ImportStatement;
    testStringLiteral(importStmt2.fileName, 'utils.tn');

    expect(program.stmts[2]).toBeInstanceOf(Return);
});

test('test parse integer literal', () => {
    const tests = [
        { input: '5;', expectedValue: 5 },
        { input: '0;', expectedValue: 0 },
        { input: '10', expectedValue: 10 },
        { input: '99999', expectedValue: 99999 },
    ];

    tests.forEach(({ input, expectedValue }) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParseErrors(parser);
        expect(program.stmts.length).toEqual(1);
        const expr = getExpression(program.stmts[0]);
        testIntExpr(expr, expectedValue);
    });
});

test('test parse boolean literal', () => {
    const tests = [
        { input: 'true;', expectedValue: true },
        { input: 'false;', expectedValue: false },
    ];

    tests.forEach(({ input, expectedValue }) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParseErrors(parser);
        expect(program.stmts.length).toEqual(1);
        const expr = getExpression(program.stmts[0]);
        expect(expr).toBeInstanceOf(BooleanLiteral);
        expect((expr as BooleanLiteral).value).toEqual(expectedValue);
    });
});

test('test parse identifier expression', () => {
    const tests = [
        { input: 'x', expectedValue: 'x' },
        { input: 'Xy', expectedValue: 'Xy' },
        { input: 'foobar;', expectedValue: 'foobar' },
    ];

    tests.forEach(({ input, expectedValue }) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParseErrors(parser);
        expect(program.stmts.length).toEqual(1);
        const expr = getExpression(program.stmts[0]);
        testIdentifier(expr, expectedValue);
    });
});

function testIntExpr(expr: IExpression, expectedValue: number) {
    expect(expr).toBeInstanceOf(IntLiteral);
    expect((expr as IntLiteral).value).toEqual(expectedValue);
}

function testIdentifier(expr: IExpression, expectedName: string) {
    expect(expr).toBeInstanceOf(Identifier);
    expect((expr as Identifier).name).toEqual(expectedName);
}

function testBooleanLiteral(expr: IExpression, expectedValue: boolean) {
    expect(expr).toBeInstanceOf(BooleanLiteral);
    expect((expr as BooleanLiteral).value).toEqual(expectedValue);
}

function getExpression(stmt: IStatement): IExpression {
    expect(stmt).toBeInstanceOf(ExpressionStatement);
    const expr = (stmt as ExpressionStatement).expr;
    if (!expr) {
        console.error('Statement: ', stmt);
        throw new Error(`Failed to get expression.`);
    }
    return expr;
}

function checkParseErrors(parser: Parser) {
    if (parser.errors.length !== 0) {
        console.log(parser.errors);
        throw new Error('Expected no parse error');
    }
}

function testLiteralExpression(expr: IExpression, value: any) {
    switch (typeof value) {
        case 'number':
            testIntExpr(expr, value);
            break;
        case 'string':
            testIdentifier(expr, value);
            break;
        case 'boolean':
            testBooleanLiteral(expr, value);
            break;
        default:
            throw new Error(`Type of expr not handled. Got=${expr}`);
    }
}

function testInfixExpression(
    expr: IExpression,
    left: any,
    operator: string,
    right: any
) {
    expect(expr).toBeInstanceOf(InfixExpression);
    const infixExpr = expr as InfixExpression;
    testLiteralExpression(infixExpr.left, left);
    expect(infixExpr.operator).toEqual(operator);
    testLiteralExpression(infixExpr.right, right);
}

function testPrefixExpression(expr: IExpression, operator: string, right: any) {
    expect(expr).toBeInstanceOf(PrefixExpression);
    const prefixExpr = expr as PrefixExpression;
    expect(prefixExpr.operator).toEqual(operator);
    testLiteralExpression(prefixExpr.expr, right);
}

function testStringLiteral(expr: IExpression, str: string) {
    expect(expr).toBeInstanceOf(StringLiteral);
    expect((expr as StringLiteral).value).toEqual(str);
}
