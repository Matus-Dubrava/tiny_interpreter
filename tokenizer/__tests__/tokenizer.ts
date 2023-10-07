import { TokenType, Tokenizer } from '..';

test('test tokenizer', () => {
    const input = '=+(){},;';

    const tests = [
        [TokenType.Assign, '='],
        [TokenType.Plus, '+'],
        [TokenType.LParen, '('],
        [TokenType.RParen, ')'],
        [TokenType.LBrace, '{'],
        [TokenType.RBrace, '}'],
        [TokenType.Comma, ','],
        [TokenType.Semicolon, ';'],
        [TokenType.EOF, ''],
    ];

    const tokenizer = new Tokenizer(input);

    tests.forEach(([expectedType, expectedLiteral]) => {
        const tok = tokenizer.nextToken();
        expect(tok.type).toBe(expectedType);
        expect(tok.literal).toBe(expectedLiteral);
    });
});
