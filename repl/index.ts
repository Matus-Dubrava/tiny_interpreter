import * as readline from 'readline';
import { Lexer } from '../lexer';
import { Parser } from '../parser';
import { evaluate } from '../evaluator';
import { ProgramEnvironment } from '../object/environment';

const env = new ProgramEnvironment();

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
        const evaluated = evaluate(program, env);
        if (evaluated) {
            console.log(evaluated.toString());
        }

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
