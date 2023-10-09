import { Lexer, Token, TokenType } from '../lexer';
import {
    Program,
    Let,
    Return,
    IStatement,
    IExpression,
    Identifier,
    IntLiteral,
    ExpressionStatement,
    PrefixExpression,
    InfixExpression,
    BooleanLiteral,
    IfExpression,
    BlockStatement,
    FunctionLiteral,
    CallExpression,
} from '../ast';

type PrefixParseFn = () => IExpression | null;
type InfixParseFn = (left: IExpression) => IExpression | null;

enum Precedence {
    LOWEST,
    LOGICAL_OR,
    LOGICAL_AND,
    EQUALS,
    LESSGREATER,
    SUM,
    PRODUCT,
    PREFIX,
    CALL,
}

const operatorPrecedence = {
    [TokenType.Equal]: Precedence.EQUALS,
    [TokenType.NotEqual]: Precedence.EQUALS,
    [TokenType.LessThan]: Precedence.LESSGREATER,
    [TokenType.LessThanOrEq]: Precedence.LESSGREATER,
    [TokenType.GreaterThan]: Precedence.LESSGREATER,
    [TokenType.GreaterThanOrEq]: Precedence.LESSGREATER,
    [TokenType.Plus]: Precedence.SUM,
    [TokenType.Minus]: Precedence.SUM,
    [TokenType.Slash]: Precedence.PRODUCT,
    [TokenType.Asterisk]: Precedence.PRODUCT,
    [TokenType.Percent]: Precedence.PRODUCT,
    [TokenType.And]: Precedence.LOGICAL_AND,
    [TokenType.Or]: Precedence.LOGICAL_OR,
    [TokenType.LParen]: Precedence.CALL,
} as const;

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
        this.registerPrefixFn(TokenType.True, this.parseBool.bind(this));
        this.registerPrefixFn(TokenType.False, this.parseBool.bind(this));
        this.registerPrefixFn(
            TokenType.LParen,
            this.parseGroupedExpression.bind(this)
        );
        this.registerPrefixFn(TokenType.If, this.parseIfExpression.bind(this));
        this.registerPrefixFn(
            TokenType.Function,
            this.parseFunctionLiteral.bind(this)
        );

        this.registerInfixFn(
            TokenType.And,
            this.parseInfixExpression.bind(this)
        );
        this.registerInfixFn(
            TokenType.Or,
            this.parseInfixExpression.bind(this)
        );
        this.registerInfixFn(
            TokenType.Slash,
            this.parseInfixExpression.bind(this)
        );
        this.registerInfixFn(
            TokenType.Asterisk,
            this.parseInfixExpression.bind(this)
        );
        this.registerInfixFn(
            TokenType.Percent,
            this.parseInfixExpression.bind(this)
        );
        this.registerInfixFn(
            TokenType.Plus,
            this.parseInfixExpression.bind(this)
        );
        this.registerInfixFn(
            TokenType.Minus,
            this.parseInfixExpression.bind(this)
        );
        this.registerInfixFn(
            TokenType.Equal,
            this.parseInfixExpression.bind(this)
        );
        this.registerInfixFn(
            TokenType.NotEqual,
            this.parseInfixExpression.bind(this)
        );
        this.registerInfixFn(
            TokenType.LessThan,
            this.parseInfixExpression.bind(this)
        );
        this.registerInfixFn(
            TokenType.LessThanOrEq,
            this.parseInfixExpression.bind(this)
        );
        this.registerInfixFn(
            TokenType.GreaterThan,
            this.parseInfixExpression.bind(this)
        );
        this.registerInfixFn(
            TokenType.GreaterThanOrEq,
            this.parseInfixExpression.bind(this)
        );
        this.registerInfixFn(
            TokenType.LParen,
            this.parseCallExpression.bind(this)
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

    parseBlockStatement(): BlockStatement {
        const curTok = this.curTok;
        const stmts: IStatement[] = [];
        this.nextToken();

        while (
            this.curTok.type !== TokenType.RBrace &&
            this.curTok.type !== TokenType.EOF
        ) {
            const stmt = this.parseStatement();
            if (stmt) {
                stmts.push(stmt);
            }
            this.nextToken();
        }

        return new BlockStatement(curTok, stmts);
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
        return new IntLiteral(this.curTok, Number(this.curTok.literal));
    }

    parseBool(): IExpression {
        if (this.curTok.literal === 'true') {
            return new BooleanLiteral(this.curTok, true);
        } else {
            return new BooleanLiteral(this.curTok, false);
        }
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

        let leftExpr = prefixFn();

        while (
            this.peekTok.type !== TokenType.Semicolon &&
            precedence < this.getPeekPrecedence()
        ) {
            if (!leftExpr) {
                return null;
            }

            const infixFn = this.infixFns[this.peekTok.type];
            if (!infixFn) {
                return leftExpr;
            }

            this.nextToken();

            leftExpr = infixFn(leftExpr);
        }

        return leftExpr;
    }

    /**
     * Prefix expression form: <operator><expression>
     * i.e. -5, !true, -(1 + 2)
     */
    parsePrefixExpression(): IExpression | null {
        const curTok = this.curTok;
        this.nextToken();

        const expr = this.parseExpression(Precedence.PREFIX);
        if (!expr) {
            return null;
        }

        return new PrefixExpression(curTok, curTok.literal, expr);
    }

    parseInfixExpression(left: IExpression): IExpression | null {
        const curTok = this.curTok;
        const precedence = this.getCurrentPrecedence();
        this.nextToken();

        const expr = this.parseExpression(precedence);
        if (!expr) {
            return null;
        }

        return new InfixExpression(curTok, left, curTok.literal, expr);
    }

    parseGroupedExpression(): IExpression | null {
        this.nextToken();

        const expr = this.parseExpression(Precedence.LOWEST);

        if (!this.expectPeekTokenToBeAndAdvance(TokenType.RParen)) {
            return null;
        }

        return expr;
    }

    parseIfExpression(): IExpression | null {
        const curTok = this.curTok;

        this.expectPeekTokenToBeAndAdvance(TokenType.LParen);
        this.nextToken(); // start of expression

        const condition = this.parseExpression(Precedence.LOWEST);
        if (!condition) {
            return null;
        }

        if (!this.expectPeekTokenToBeAndAdvance(TokenType.RParen)) {
            return null;
        }

        if (!this.expectPeekTokenToBeAndAdvance(TokenType.LBrace)) {
            return null;
        }

        const consequence = this.parseBlockStatement();
        this.nextToken();

        if (this.curTok.type !== TokenType.Else) {
            return new IfExpression(curTok, condition, consequence);
        }

        if (!this.expectPeekTokenToBeAndAdvance(TokenType.LBrace)) {
            return null;
        }

        const alternative = this.parseBlockStatement();

        this.nextToken();

        return new IfExpression(curTok, condition, consequence, alternative);
    }

    parseCallExpression(left: IExpression): IExpression | null {
        const curTok = this.curTok;
        const args: IExpression[] = [];

        while (this.curTok.type !== TokenType.RParen) {
            this.nextToken();
            const expr = this.parseExpression(Precedence.LOWEST);
            if (!expr) {
                return null;
            }

            args.push(expr);

            this.nextToken();
            if (
                this.curTok.type !== TokenType.RParen &&
                this.curTok.type !== TokenType.Comma
            ) {
                this.errors.push(
                    `Error while parsing call expression. Expected ',' or ')', got='${this.curTok.type}'`
                );
                return null;
            }
        }

        return new CallExpression(curTok, left, args);
    }

    parseFunctionLiteral(): IExpression | null {
        const curTok = this.curTok;

        this.expectPeekTokenToBeAndAdvance(TokenType.LParen);

        const params = this.parseListOfParameters();
        if (!params) {
            return null;
        }

        this.expectPeekTokenToBeAndAdvance(TokenType.LBrace);

        const body = this.parseBlockStatement();

        return new FunctionLiteral(curTok, params, body);
    }

    /**
     * Produces list of identifiers.
     * Leaves the current token at closing `)`.
     */
    parseListOfParameters(): Identifier[] | null {
        const params: Identifier[] = [];
        while (this.peekTok.type !== TokenType.RParen) {
            this.nextToken();
            const ident = this.parseIdentifier();
            params.push(ident);
            if (
                this.peekTok.type !== TokenType.Comma &&
                this.peekTok.type !== TokenType.RParen
            ) {
                this.errors.push(
                    `Failed to parse parameters. Expected ',' or ')', got='${this.peekTok.type}'`
                );
                return null;
            }

            if (this.peekTok.type === TokenType.Comma) {
                this.nextToken();
            }
        }
        this.nextToken();
        return params;
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

    getCurrentPrecedence() {
        const precedence = operatorPrecedence[this.curTok.type];
        if (!precedence) {
            return Precedence.LOWEST;
        }
        return precedence;
    }

    getPeekPrecedence() {
        const precedence = operatorPrecedence[this.peekTok.type];
        if (!precedence) {
            return Precedence.LOWEST;
        }
        return precedence;
    }
}
