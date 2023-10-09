import { Lexer, Token, TokenType } from '../lexer';
import {
    Program,
    Let,
    Return,
    IStatement,
    IExpression,
    Identifier,
    Int,
    ExpressionStatement,
    PrefixExpression,
} from '../ast';

type PrefixParseFn = (parser: Parser) => IExpression | null;
type InfixParseFn = (parser: Parser, left: IExpression) => IExpression | null;

enum Precedence {
    LOWEST,
    EQUALS,
    LESSGREATER,
    SUM,
    PRODUCT,
    PREFIX,
    CALL,
}

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

        this.registerPrefixFn(TokenType.Int, this.parseInt.bind(this));
        this.registerPrefixFn(TokenType.Ident, this.parseIdentifier.bind(this));
        this.registerPrefixFn(
            TokenType.Minus,
            this.parsePrefixExpression.bind(this)
        );
        this.registerPrefixFn(
            TokenType.Bang,
            this.parsePrefixExpression.bind(this)
        );
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
        const expr = this.parseExpression(Precedence.LOWEST);
        if (!expr) {
            return null;
        }

        this.advanceToSemicoloIfExists();

        return new ExpressionStatement(curTok, expr);
    }

    parseInt(): IExpression {
        return new Int(this.curTok, Number(this.curTok.literal));
    }

    parseIdentifier(): Identifier {
        return new Identifier(this.curTok, this.curTok.literal);
    }

    parseLetStatement(): IStatement | null {
        const curTok = this.curTok;
        this.nextToken();

        const ident = new Identifier(this.curTok, this.curTok.literal);

        this.expectPeekTokenToBeAndAdvance(TokenType.Assign);

        this.nextToken();

        const expr = this.parseExpression(Precedence.LOWEST);
        if (!expr) {
            return null;
        }

        this.advanceToSemicoloIfExists();

        return new Let(curTok, ident, expr);
    }

    parseReturnStatement(): IStatement | null {
        const curTok = this.curTok;
        this.nextToken();

        const expr = this.parseExpression(Precedence.LOWEST);
        if (!expr) {
            return null;
        }

        this.advanceToSemicoloIfExists();

        return new Return(curTok, expr);
    }

    parseExpression(precedence: Precedence): IExpression | null {
        const prefixFn = this.prefixFns[this.curTok.type];
        if (!prefixFn) {
            this.errors.push(
                `No prefix parse function for ${this.curTok.type}`
            );
            return null;
        }

        const leftExpr = prefixFn(this);

        return leftExpr;
    }

    /**
     * Prefix expression form: <operator><expression>
     * i.e. -5, !true, -(1 + 2)
     */
    parsePrefixExpression(): IExpression | null {
        const curTok = this.curTok;
        this.nextToken();

        const expr = this.parseExpression(Precedence.LOWEST);
        if (!expr) {
            return null;
        }

        return new PrefixExpression(curTok, curTok.literal, expr);
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
