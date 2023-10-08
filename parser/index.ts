import { Lexer, Token, TokenType } from '../lexer';
import {
    Program,
    Let,
    Return,
    IStatement,
    IExpression,
    DummyExpr,
    Identifier,
} from '../ast';

export class Parser {
    lex: Lexer;
    curTok!: Token;
    peekTok!: Token;
    errors: string[] = [];

    constructor(lex: Lexer) {
        this.lex = lex;
        this.curTok = lex.nextToken();
        this.peekTok = lex.nextToken();
    }

    parseProgram(): Program {
        const stmts: IStatement[] = [];

        while (this.curTok.type != TokenType.EOF) {
            const stmt = this.parseStatement();
            if (stmt) {
                stmts.push(stmt);
            }
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
                return null;
        }
    }

    parseIdentifier(): Identifier | null {
        if (this.curTok.type !== TokenType.Ident) {
            this.errors.push(
                `Failed to parse identifier. Got='${this.curTok}'`
            );
            return null;
        }

        return new Identifier(this.curTok, this.curTok.literal);
    }

    parseLetStatement(): IStatement | null {
        const curTok = this.curTok;
        this.nextToken();

        const ident = this.parseIdentifier();
        if (!ident) {
            return null;
        }

        this.nextToken();

        if (this.curTok.type !== TokenType.Assign) {
            this.errors.push(
                `Failed to parse Let statement. Expected '=', got='${this.curTok.literal}'`
            );
        }

        this.nextToken();

        const expr = this.parseExpression();
        if (!expr) {
            return null;
        }

        if (this.curTok.type === TokenType.Semicolon) {
            this.nextToken();
        }

        return new Let(curTok, ident, new DummyExpr());
    }

    parseReturnStatement(): IStatement | null {
        const curTok = this.curTok;

        this.nextToken();

        const expr = this.parseExpression();
        if (!expr) {
            return null;
        }

        if (this.curTok.type === TokenType.Semicolon) {
            this.nextToken();
        }

        return new Return(curTok, expr);
    }

    parseExpression(): IExpression | null {
        this.readUnilSemicolon();

        return new DummyExpr();
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
}
