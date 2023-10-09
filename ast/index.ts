import { Token, createToken, TokenType } from '../lexer';

export interface INode {
    tokenLiteral(): string;
    toString(): string;
}

export interface IStatement extends INode {
    statementNode(): void;
}

export interface IExpression extends INode {
    expressionNode(): void;
}

export class DummyExpr implements IExpression {
    token!: Token;
    value!: string;

    constructor() {
        this.token = createToken(TokenType.Illegal, 'DUMMY');
        this.value = 'DUMMY';
    }

    expressionNode(): void {}

    tokenLiteral(): string {
        return this.token.literal;
    }

    toString(): string {
        return `DUMMY EXPRESSION`;
    }
}

export class Program implements INode {
    stmts: IStatement[];

    constructor(stmts: IStatement[]) {
        this.stmts = stmts;
    }

    tokenLiteral(): string {
        if (this.stmts.length > 0) {
            return this.stmts[0].tokenLiteral();
        } else {
            return '';
        }
    }
}

export class Return implements IStatement {
    token: Token;
    expr: IExpression;

    constructor(token: Token, expr: IExpression) {
        this.token = token;
        this.expr = expr;
    }

    statementNode(): void {}

    tokenLiteral(): string {
        return this.token.literal;
    }

    toString(): string {
        return `return ${this.expr}`;
    }
}

export class Let implements IStatement {
    token: Token;
    ident: Identifier;
    expr: IExpression;

    constructor(token: Token, ident: Identifier, expr: IExpression) {
        this.token = token;
        this.ident = ident;
        this.expr = expr;
    }

    statementNode(): void {}

    tokenLiteral(): string {
        return this.token.literal;
    }

    toString(): string {
        return `let ${this.ident.name} = ${this.expr}`;
    }
}

export class Identifier implements IExpression {
    token: Token;
    name: string;

    constructor(token: Token, name: string) {
        this.token = token;
        this.name = name;
    }

    expressionNode(): void {}

    tokenLiteral(): string {
        return this.token.literal;
    }

    toString(): string {
        return this.name;
    }
}

export class Int implements IExpression {
    token: Token;
    value: number;

    constructor(token: Token, value: number) {
        this.token = token;
        this.value = value;
    }

    expressionNode(): void {}

    tokenLiteral(): string {
        return this.token.literal;
    }

    toString(): string {
        return this.token.literal;
    }
}

export class BooleanLiteral implements IExpression {
    token: Token;
    value: boolean;

    constructor(token: Token, value: boolean) {
        this.token = token;
        this.value = value;
    }

    expressionNode(): void {}

    tokenLiteral(): string {
        return this.token.literal;
    }

    toString(): string {
        return this.token.literal;
    }
}

export class ExpressionStatement implements IStatement {
    token: Token;
    expr: IExpression;

    constructor(token: Token, expr: IExpression) {
        this.token = token;
        this.expr = expr;
    }

    statementNode(): void {}

    tokenLiteral(): string {
        return this.token.literal;
    }

    toString(): string {
        return this.expr.toString();
    }
}

export class PrefixExpression implements IExpression {
    token: Token;
    operator: string;
    expr: IExpression;

    constructor(token: Token, operator: string, expr: IExpression) {
        this.token = token;
        this.operator = operator;
        this.expr = expr;
    }

    expressionNode(): void {}

    tokenLiteral(): string {
        return this.token.literal;
    }

    toString(): string {
        return `${this.operator}${this.expr.toString()}`;
    }
}

export class InfixExpression implements IExpression {
    token: Token;
    left: IExpression;
    operator: string;
    right: IExpression;

    constructor(
        token: Token,
        left: IExpression,
        operator: string,
        right: IExpression
    ) {
        this.token = token;
        this.left = left;
        this.operator = operator;
        this.right = right;
    }

    expressionNode(): void {}

    tokenLiteral(): string {
        return this.token.literal;
    }

    toString(): string {
        return `(${this.left} ${this.operator} ${this.right})`;
    }
}
