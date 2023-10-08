export const TokenType = {
    Let: 'LET',
    Ident: 'INDENT',
    Assign: '=',
    Int: 'INT',
    Plus: '+',
    Semicolon: ';',
    LParen: '(',
    RParen: ')',
    LBrace: '{',
    RBrace: '}',
    Function: 'FUNCTION',
    Return: 'RETURN',
    EOF: 'EOF',
    Illegal: 'ILLEGAL',
    Comma: ',',
    Colon: ':',
    If: 'if',
    Else: 'else',
    Equal: '==',
    NotEqual: '!=',
    Bang: '!',
    Minus: '-',
    Slash: '/',
    Asterisk: '*',
    LT: '<',
    GT: '>',
    True: 'true',
    False: 'false',
};

type TokenType = (typeof TokenType)[keyof typeof TokenType];

type Token = {
    type: TokenType;
    literal: string;
};

export class Lexer {
    input: string;
    position: number = 0;
    readPosition: number = 0;
    ch!: string;

    constructor(input: string) {
        this.input = input;
        this.readChar();
    }

    nextToken(): Token {
        let tok: Token | undefined;
        switch (this.ch) {
            case '=':
                tok = createToken(TokenType.Assign, this.ch);
                break;
            case ';':
                tok = createToken(TokenType.Semicolon, this.ch);
                break;
            case '(':
                tok = createToken(TokenType.LParen, this.ch);
                break;
            case ')':
                tok = createToken(TokenType.RParen, this.ch);
                break;
            case ',':
                tok = createToken(TokenType.Comma, this.ch);
                break;
            case '+':
                tok = createToken(TokenType.Plus, this.ch);
                break;
            case '{':
                tok = createToken(TokenType.LBrace, this.ch);
                break;
            case '}':
                tok = createToken(TokenType.RBrace, this.ch);
                break;
            case '-':
                tok = createToken(TokenType.Minus, this.ch);
                break;
            case '!':
                tok = createToken(TokenType.Bang, this.ch);
                break;
            case '/':
                tok = createToken(TokenType.Slash, this.ch);
                break;
            case '*':
                tok = createToken(TokenType.Asterisk, this.ch);
                break;
            case '<':
                tok = createToken(TokenType.LT, this.ch);
                break;
            case '>':
                tok = createToken(TokenType.GT, this.ch);
                break;
            case '\0':
                tok = createToken(TokenType.EOF, '');
                break;
            default:
                tok = createToken(TokenType.Illegal, '');
        }
        this.readChar();
        return tok;
    }

    eatWhitespace(): void {
        while (this.ch == ' ' || this.ch == '\n' || this.ch == '\t') {
            this.readChar();
        }
    }

    readChar(): void {
        if (this.readPosition >= this.input.length) {
            this.ch = '\0';
        } else {
            this.ch = this.input[this.readPosition];
        }

        this.position += 1;
        this.readPosition += 1;
    }
}

export function createToken(type: TokenType, literal: string): Token {
    return {
        type,
        literal,
    };
}

const tok = createToken(TokenType.Return, 'return');
