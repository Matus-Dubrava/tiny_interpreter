import { Lexer, TokenType } from '../../lexer';
import {
    IExpression,
    IStatement,
    Let,
    Return,
    ExpressionStatement,
    Int,
    PrefixExpression,
    Identifier,
} from '../../ast';
import { Parser } from '../index';

test('test parse prefix expression', () => {
    const tests = [
        { input: '!5', expectedOperator: '!', expectedIntValue: 5 },
        { input: '-999', expectedOperator: '-', expectedIntValue: 999 },
        { input: '!0;', expectedOperator: '!', expectedIntValue: 0 },
    ];

    tests.forEach(({ input, expectedOperator, expectedIntValue }) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParseErrors(parser);
        expect(program.stmts.length).toEqual(1);
        const prefixExpr = getExpression(program.stmts[0]) as PrefixExpression;
        expect(prefixExpr).toBeInstanceOf(PrefixExpression);
        expect(prefixExpr.operator).toEqual(expectedOperator);
        testIntExpr(prefixExpr.expr, expectedIntValue);
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
