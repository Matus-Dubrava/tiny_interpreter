import * as readline from 'readline';
import { Lexer, TokenType } from '../lexer';
import { Parser } from '../parser';

export function repl() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('>> ', (input) => {
        const lex = new Lexer(input);
        const parser = new Parser(lex);
        const program = parser.parseProgram();
        if (parser.errors.length > 0) {
            console.log(parser.errors);
            rl.close();
            return;
        }

        console.log(program.toString());

        rl.close();
    });

    rl.on('SIGINT', () => {
        console.log('\n');
        process.exit();
    });

    rl.on('SIGTERM', () => {
        process.exit();
    });

    rl.on('close', () => {
        repl();
    });
}
