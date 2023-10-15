import { repl } from './src/repl';
import { Evaluator } from './src/evaluator';
import { ProgramEnvironment } from './src/object/environment';
import { readFileSync } from 'fs';
import { Lexer } from './src/lexer';
import { Parser } from './src/parser';
import { ErrorObj } from './src/object';

const args = process.argv.slice(2);

if (args.length === 1) {
    const env = new ProgramEnvironment();
    const evaluator = new Evaluator();
    const input = readFileSync(args[0]).toString();
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();
    if (parser.errors.length !== 0) {
        console.log(parser.errors);
    }
    const evaluated = evaluator.evaluate(program, env);
    if (evaluated instanceof ErrorObj) {
        console.error(evaluated.toString());
    }
} else {
    repl();
}
