import { Lexer, TokenType } from '../../lexer';
import {
    IExpression,
    IStatement,
    Let,
    Return,
    ExpressionStatement,
    Int,
    PrefixExpression,
    InfixExpression,
    Identifier,
    BooleanLiteral,
    IfExpression,
    FunctionLiteral,
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
        { input: '3 + 4; -5 * 5', expected: '(3 + 4)((-5) * 5)' },
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
    ];

    tests.forEach(({ input, expected }) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParseErrors(parser);
        expect(program.toString()).toEqual(expected);
    });
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

test('test parse if expression', () => {
    const input = 'if (x < y) { x }';

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    console.log(program);
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
    expect(expr).toBeInstanceOf(Int);
    expect((expr as Int).value).toEqual(expectedValue);
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
