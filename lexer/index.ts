export const TokenType = {
    Let: 'LET',
    Ident: 'INDENT',
    Import: 'IMPORT',
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
    LessThan: '<',
    LessThanOrEq: '<=',
    GreaterThan: '>',
    GreaterThanOrEq: '>=',
    True: 'true',
    False: 'false',
    Or: '||',
    And: '&&',
    Percent: '%',
    String: 'STRING',
    LBracket: '[',
    RBracket: ']',
};

export type TokenItem = (typeof TokenType)[keyof typeof TokenType];

export type Token = {
    type: TokenItem;
    literal: string;
};

const Keywords = {
    fn: createToken(TokenType.Function, 'fn'),
    true: createToken(TokenType.True, 'true'),
    false: createToken(TokenType.False, 'false'),
    let: createToken(TokenType.Let, 'let'),
    return: createToken(TokenType.Return, 'return'),
    if: createToken(TokenType.If, 'if'),
    else: createToken(TokenType.Else, 'else'),
    import: createToken(TokenType.Import, 'import'),
} as const;

function isLetter(letter: string): boolean {
    const char = letter.charCodeAt(0);
    return (
        (char >= 'a'.charCodeAt(0) && char <= 'z'.charCodeAt(0)) ||
        (char >= 'A'.charCodeAt(0) && char <= 'Z'.charCodeAt(0)) ||
        char == '_'.charCodeAt(0)
    );
}

function isNumber(letter: string): boolean {
    const char = letter.charCodeAt(0);
    return char >= '0'.charCodeAt(0) && char <= '9'.charCodeAt(0);
}

export class Lexer {
    input: string;
    position: number = 0;
    readPosition: number = 0;
    ch!: string;
    debug: boolean;

    constructor(input: string, debug: boolean = false) {
        this.input = input;
        this.debug = debug;
        this.readChar();
    }

    nextToken(): Token {
        let tok: Token | undefined;
        let twoCharTok: Token | null;

        this.eatWhitespace();

        switch (this.ch) {
            case '[':
                tok = createToken(TokenType.LBracket, '[');
                break;
            case ']':
                tok = createToken(TokenType.RBracket, ']');
                break;
            case '%':
                tok = createToken(TokenType.Percent, this.ch);
                break;
            case '=':
                twoCharTok = this.readTwoCharToken();
                if (twoCharTok) {
                    tok = twoCharTok;
                } else {
                    tok = createToken(TokenType.Assign, this.ch);
                }
                break;
            case '!':
                twoCharTok = this.readTwoCharToken();
                if (twoCharTok) {
                    tok = twoCharTok;
                } else {
                    tok = createToken(TokenType.Bang, this.ch);
                }
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
            case '/':
                tok = createToken(TokenType.Slash, this.ch);
                break;
            case '*':
                tok = createToken(TokenType.Asterisk, this.ch);
                break;
            case '<':
                twoCharTok = this.readTwoCharToken();
                if (twoCharTok) {
                    tok = createToken(TokenType.LessThanOrEq, '<=');
                } else {
                    tok = createToken(TokenType.LessThan, this.ch);
                }
                break;
            case '>':
                twoCharTok = this.readTwoCharToken();
                if (twoCharTok) {
                    tok = createToken(TokenType.GreaterThanOrEq, '>=');
                } else {
                    tok = createToken(TokenType.GreaterThan, this.ch);
                }
                break;
            case '&':
                twoCharTok = this.readTwoCharToken();
                if (twoCharTok) {
                    tok = twoCharTok;
                } else {
                    tok = createToken(TokenType.Illegal, this.ch);
                }
                break;
            case '|':
                twoCharTok = this.readTwoCharToken();
                if (twoCharTok) {
                    tok = twoCharTok;
                } else {
                    tok = createToken(TokenType.Illegal, this.ch);
                }
                break;
            case `"`:
                const stringToken = this.readString();
                if (stringToken) {
                    tok = stringToken;
                } else {
                    tok = createToken(TokenType.Illegal, this.ch);
                }
                break;
            case '\0':
                tok = createToken(TokenType.EOF, '');
                break;
            default:
                if (isLetter(this.ch)) {
                    const ident: string = this.readIdentifier();
                    const keyword = Keywords[ident as keyof typeof Keywords];
                    if (keyword) {
                        return keyword;
                    } else {
                        return createToken(TokenType.Ident, ident);
                    }
                } else if (isNumber(this.ch)) {
                    const word: string = this.readNumber();
                    return createToken(TokenType.Int, word);
                }
                tok = createToken(TokenType.Illegal, '');
        }

        if (this.debug) {
            console.log(
                `produced token=(type: ${tok.type}, lit: ${
                    tok.literal
                }), cur. char=${this.ch}, next char=${this.peekChar()}`
            );
        }

        this.readChar();
        return tok;
    }

    eatWhitespace(): void {
        while (this.ch == ' ' || this.ch == '\n' || this.ch == '\t') {
            this.readChar();
        }
    }

    readString(): Token | null {
        const position = this.position;
        this.readChar();
        while (this.ch !== `"`) {
            if (this.ch === '\0') {
                return null;
            }
            this.readChar();
        }
        return createToken(
            TokenType.String,
            this.input.substring(position, this.position - 1)
        );
    }

    readTwoCharToken(): Token | null {
        if (this.ch == '=' && this.peekChar() == '=') {
            this.readChar();
            return createToken(TokenType.Equal, '==');
        } else if (this.ch == '!' && this.peekChar() == '=') {
            this.readChar();
            return createToken(TokenType.NotEqual, '!=');
        } else if (this.ch == '&' && this.peekChar() == '&') {
            this.readChar();
            return createToken(TokenType.And, '&&');
        } else if (this.ch == '|' && this.peekChar() == '|') {
            this.readChar();
            return createToken(TokenType.Or, '||');
        } else if (this.ch == '>' && this.peekChar() == '=') {
            this.readChar();
            return createToken(TokenType.GreaterThanOrEq, '>=');
        } else if (this.ch == '<' && this.peekChar() == '=') {
            this.readChar();
            return createToken(TokenType.LessThanOrEq, '<=');
        }
        return null;
    }

    peekChar(): string {
        if (this.readPosition >= this.input.length) {
            return '\0';
        } else {
            return this.input[this.readPosition];
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

    readIdentifier(): string {
        let ident: string = '';
        while (isLetter(this.ch) || isNumber(this.ch)) {
            ident += this.ch;
            this.readChar();
        }
        return ident;
    }

    readNumber(): string {
        let word: string = '';
        while (isNumber(this.ch)) {
            word += this.ch;
            this.readChar();
        }
        return word;
    }
}

export function createToken(type: TokenItem, literal: string): Token {
    return {
        type,
        literal,
    };
}
