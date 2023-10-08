import { Lexer, TokenType } from '../../lexer';
import { Let, Return } from '../../ast';
import { Parser } from '../index';

test('test parse multiple statemenets', () => {
    const input = `
        let x = 5;;;
        return (1 + 2);
        let y = 3;
        return fn(a, b) {a + b};
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
        { input: 'let x = 5;', name: 'x' },
        { input: 'let x = 5;', name: 'x' },
        { input: 'let y = (x + 1);', name: 'y' },
        { input: 'let something = 5;', name: 'something' },
    ];

    tests.forEach(({ input, name }) => {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        checkParseErrors(parser);

        expect(program.stmts.length).toEqual(1);
        expect((program.stmts[0] as Let).token.type).toEqual(TokenType.Let);
        expect((program.stmts[0] as Let).ident.name).toEqual(name);
    });
});

test('test parse return statement', () => {
    const input = 'return (x + 1);';

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    checkParseErrors(parser);

    expect(program.stmts.length).toEqual(1);
    expect((program.stmts[0] as Return).token.type).toEqual(TokenType.Return);
});

function checkParseErrors(parser: Parser) {
    if (parser.errors.length !== 0) {
        console.log(parser.errors);
        throw new Error('Expected no parse error');
    }
}
