import { Lexer, TokenType } from '../../lexer';
import { Let, Return } from '../../ast';
import { Parser } from '../index';

test('test parse let statement', () => {
    const input = 'let x = 5;';

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    expect(program.stmts.length).toEqual(1);
    expect((program.stmts[0] as Let).token.type).toEqual(TokenType.Let);
    expect((program.stmts[0] as Let).ident.name).toEqual('x');
});

test('test parse return statement', () => {
    const input = 'return (x + 1);';

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    expect(program.stmts.length).toEqual(1);
    expect((program.stmts[0] as Return).token.type).toEqual(TokenType.Return);
});
