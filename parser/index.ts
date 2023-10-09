import { Lexer, Token, TokenType } from '../lexer';
import {
    Program,
    Let,
    Return,
    IStatement,
    IExpression,
    DummyExpr,
    Identifier,
    Int,
    ExpressionStatement,
} from '../ast';

type PrefixParseFn = (parser: Parser) => IExpression | null;
type InfixParseFn = (parser: Parser, left: IExpression) => IExpression | null;

export class Parser {
    lex: Lexer;
    curTok!: Token;
    peekTok!: Token;
    errors: string[] = [];
    prefixFns: { [key in string]: PrefixParseFn } = {};
    infixFns: { [key in string]: InfixParseFn } = {};

    constructor(lex: Lexer) {
        this.lex = lex;
        this.curTok = lex.nextToken();
        this.peekTok = lex.nextToken();

        this.registerPrefixFn(TokenType.Int, this.parseInt);
        this.registerPrefixFn(TokenType.Ident, this.parseIdentifier);
    }

    registerPrefixFn(tokenType: string, fn: PrefixParseFn): void {
        this.prefixFns[tokenType] = fn;
    }

    registerInfixFn(tokenType: string, fn: InfixParseFn): void {
        this.infixFns[tokenType] = fn;
    }

    parseProgram(): Program {
        const stmts: IStatement[] = [];

        while (this.curTok.type != TokenType.EOF) {
            const stmt = this.parseStatement();
            if (stmt) {
                stmts.push(stmt);
            }
            this.nextToken();
        }

        return new Program(stmts);
    }

    parseStatement(): IStatement | null {
        switch (this.curTok.type) {
            case TokenType.Return:
                return this.parseReturnStatement();
            case TokenType.Let:
                return this.parseLetStatement();
            default:
                return this.parseExpressionStatement();
        }
    }

    parseExpressionStatement(): IStatement | null {
        const curTok = this.curTok;
        const expr = this.parseExpression();
        if (!expr) {
            return null;
        }

        this.advanceToSemicoloIfExists();

        return new ExpressionStatement(curTok, expr);
    }

    parseInt(parser: Parser): IExpression {
        return new Int(parser.curTok, Number(parser.curTok.literal));
    }

    parseIdentifier(parser: Parser): Identifier {
        return new Identifier(parser.curTok, parser.curTok.literal);
    }

    parseLetStatement(): IStatement | null {
        const curTok = this.curTok;
        this.nextToken();

        const ident = new Identifier(this.curTok, this.curTok.literal);

        this.expectPeekTokenToBeAndAdvance(TokenType.Assign);

        this.nextToken();

        const expr = this.parseExpression();
        if (!expr) {
            return null;
        }

        this.advanceToSemicoloIfExists();

        return new Let(curTok, ident, new DummyExpr());
    }

    parseReturnStatement(): IStatement | null {
        const curTok = this.curTok;
        this.nextToken();

        const expr = this.parseExpression();
        if (!expr) {
            return null;
        }

        this.advanceToSemicoloIfExists();

        return new Return(curTok, expr);
    }

    parseExpression(): IExpression | null {
        const prefixFn = this.prefixFns[this.curTok.type];
        if (!prefixFn) {
            return null;
        }

        const leftExpr = prefixFn(this);

        return leftExpr;
    }

    readUnilSemicolon(): void {
        while (
            this.curTok.type !== TokenType.Semicolon &&
            this.curTok.type !== TokenType.EOF
        ) {
            this.nextToken();
        }
    }

    nextToken(): void {
        this.curTok = this.peekTok;
        this.peekTok = this.lex.nextToken();
    }

    expectPeekTokenToBeAndAdvance(type: string): boolean {
        if (type !== this.peekTok.type) {
            this.errors.push(`Expected '${type}', got='${this.peekTok.type}'`);
            return false;
        }
        this.nextToken();
        return true;
    }

    expectPeekTokenToBe(type: string): boolean {
        if (type != this.curTok.type) {
            this.errors.push(`Expected '${type}', got='${this.curTok.type}'`);
            return false;
        }
        return true;
    }

    expectCurTokenToBe(type: string): boolean {
        if (type !== this.curTok.type) {
            this.errors.push(`Expected '${type}', got='${this.curTok.type}'`);
            return false;
        }
        return true;
    }

    /**
     * If next token is semicolon, move to it.
     * Do nothing otherwise.
     */
    advanceToSemicoloIfExists() {
        if (this.peekTok.type === TokenType.Semicolon) {
            this.nextToken();
        }
    }
}
