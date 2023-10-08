import * as readline from 'readline';
import { Lexer, TokenType } from '../lexer';

export function repl() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('>> ', (input) => {
        let lex = new Lexer(input);

        let tok = lex.nextToken();
        while (tok.type !== TokenType.EOF) {
            console.log(tok);
            tok = lex.nextToken();
        }

        rl.close();
    });

    rl.on('SIGINT', () => {
        process.exit();
    });

    rl.on('SIGTERM', () => {
        process.exit();
    });

    rl.on('close', () => {
        repl();
    });
}
