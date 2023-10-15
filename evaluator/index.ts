import { readFileSync } from 'fs';

import {
    ArrayObj,
    BooleanObj,
    BuiltinObj,
    ErrorObj,
    FunctionObject,
    HashObj,
    HashPair,
    IObject,
    IntObj,
    ReturnObj,
    StringObj,
} from '../object';
import {
    INode,
    IntLiteral,
    Program,
    ExpressionStatement,
    Let,
    IStatement,
    BooleanLiteral,
    PrefixExpression,
    StringLiteral,
    InfixExpression,
    IfExpression,
    BlockStatement,
    IExpression,
    Return,
    Identifier,
    FunctionLiteral,
    CallExpression,
    ArrayLiteral,
    IndexExpression,
    ImportStatement,
    ExitStatement,
    HashLiteral,
} from '../ast';
import {
    ProgramEnvironment,
    createEnclosedEnvironment,
} from '../object/environment';
import { TRUE, FALSE, NULL } from '../object';
import { Builtins } from './builtins';
import { Lexer } from '../lexer';
import { Parser } from '../parser';

export class Evaluator {
    evaluate(node: INode, env: ProgramEnvironment): IObject {
        if (node instanceof Program) {
            return this.evaluateProgram(node.stmts, env);
        } else if (node instanceof BlockStatement) {
            return this.evaluateStatements(node.stmts, env);
        } else if (node instanceof ExpressionStatement) {
            return this.evaluate(node.expr, env);
        } else if (node instanceof IntLiteral) {
            return new IntObj(node.value);
        } else if (node instanceof BooleanLiteral) {
            return Evaluator.nativeBooleanToBooleanObject(node.value);
        } else if (node instanceof PrefixExpression) {
            return this.evaluatePrefixExpression(node, env);
        } else if (node instanceof InfixExpression) {
            return this.evaluateInfixExpression(node, env);
        } else if (node instanceof IfExpression) {
            return this.evaluateIfExpresion(node, env);
        } else if (node instanceof Return) {
            return this.evaluateReturnStatement(node, env);
        } else if (node instanceof Let) {
            return this.evaluateLetStatement(node, env);
        } else if (node instanceof Identifier) {
            return this.evaluateIdentifier(node, env);
        } else if (node instanceof FunctionLiteral) {
            return this.evaluateFunction(node, env);
        } else if (node instanceof CallExpression) {
            return this.evaluateFunctionCall(node, env);
        } else if (node instanceof StringLiteral) {
            return new StringObj(node.value);
        } else if (node instanceof ArrayLiteral) {
            return this.evaluateArrayLiteral(node, env);
        } else if (node instanceof IndexExpression) {
            return this.evaluateIndexExpression(node, env);
        } else if (node instanceof ImportStatement) {
            return this.evaluateImportStatement(node, env);
        } else if (node instanceof ExitStatement) {
            return this.evaluateExitStatement(node);
        } else if (node instanceof HashLiteral) {
            return this.evaluateHashLiteral(node, env);
        }

        return Evaluator.getUnrecognizedStatementError(node);
    }

    evaluateHashLiteral(node: HashLiteral, env: ProgramEnvironment): IObject {
        const pairs = new Map<string, HashPair>();

        for (const [nodeKey, nodeValue] of node.pairs) {
            const key = this.evaluate(nodeKey, env);
            if (key instanceof ErrorObj) {
                return key;
            }

            if (!key.isHashable()) {
                return new ErrorObj(`key '${key.toString()}' is not hashable`);
            }

            const value = this.evaluate(nodeValue, env);
            if (value instanceof ErrorObj) {
                return value;
            }

            const hashed = key.getHash();
            pairs.set(hashed, { key, value });
        }

        return new HashObj(pairs);
    }

    evaluateExitStatement(node: ExitStatement): IObject {
        process.exit(node.exitCode.value);
    }

    evaluateImportStatement(
        node: ImportStatement,
        env: ProgramEnvironment
    ): IObject {
        const fileContents = readFileSync(node.fileName.value).toString();
        const lexer = new Lexer(fileContents);
        const parser = new Parser(lexer);
        const program = parser.parseProgram();
        if (parser.errors.length !== 0) {
            return new ErrorObj(
                `failed to import ${
                    node.fileName.value
                }\nparsing errors: ${parser.errors.join('\n')}`
            );
        }

        // return this.evaluate(program, env);
        this.evaluate(program, env);
        return NULL;
    }

    evaluateIndexExpression(
        node: IndexExpression,
        env: ProgramEnvironment
    ): IObject {
        const array = this.evaluate(node.left, env);
        if (array instanceof ErrorObj) {
            return array;
        }

        const index = this.evaluate(node.index, env);
        if (array instanceof ErrorObj) {
            return array;
        }

        if (!(array instanceof ArrayObj) || !(index instanceof IntObj)) {
            return new ErrorObj(
                `index operator not supported: ${array.getType()}`
            );
        }

        return this.evaluateArrayIndexExpression(array, index);
    }

    evaluateArrayIndexExpression(array: ArrayObj, index: IntObj): IObject {
        if (index.value < 0 || index.value >= array.elements.length) {
            return new ErrorObj(
                `index '${index.toString()}' outside of bounds for array with length: ${
                    array.elements.length
                }`
            );
        } else return array.elements[index.value];
    }

    evaluateArrayLiteral(node: ArrayLiteral, env: ProgramEnvironment): IObject {
        const elements = this.evaluateExpressions(node.elements, env);
        if (elements.length === 1 && elements[0] instanceof ErrorObj) {
            return elements[0];
        }
        return new ArrayObj(elements);
    }

    evaluateFunctionCall(
        callExpr: CallExpression,
        env: ProgramEnvironment
    ): IObject {
        // func: IExpression; // this can be either an Identifier or Function
        // args: IExpression[];
        let fn = this.evaluate(callExpr.func, env);
        if (fn instanceof ErrorObj) {
            return fn;
        }

        const args = this.evaluateExpressions(callExpr.args, env);
        if (args.length === 1 && args[0] instanceof ErrorObj) {
            return args[0];
        }

        return this.applyFunction(fn, args);
    }

    applyFunction(fn: IObject, args: IObject[]): IObject {
        if (fn instanceof FunctionObject) {
            const env = this.extendFunctionEnvironment(fn, args);
            const evaluated = this.evaluateStatements(fn.body.stmts, env);
            return this.unwrapReturnValue(evaluated);
        } else if (fn instanceof BuiltinObj) {
            return fn.fn(...args);
        }

        return new ErrorObj(`not a function: ${fn.getType()}`);
    }

    extendFunctionEnvironment(
        fn: FunctionObject,
        args: IObject[]
    ): ProgramEnvironment {
        const env = createEnclosedEnvironment(fn.env);

        fn.params.forEach((param, i) => {
            env.set(param.name, args[i]);
        });

        return env;
    }

    unwrapReturnValue(obj: IObject): IObject {
        if (obj instanceof ReturnObj) {
            return obj.value;
        }

        return obj;
    }

    evaluateExpressions(
        expressions: IExpression[],
        env: ProgramEnvironment
    ): IObject[] {
        const result: IObject[] = [];

        for (const expr of expressions) {
            const evaluated = this.evaluate(expr, env);
            if (evaluated instanceof ErrorObj) {
                return [evaluated];
            }
            result.push(evaluated);
        }

        return result;
    }

    evaluateFunction(fn: FunctionLiteral, env: ProgramEnvironment): IObject {
        return new FunctionObject(fn.parameters, fn.body, env);
    }

    evaluateIdentifier(ident: Identifier, env: ProgramEnvironment): IObject {
        const value = env.get(ident.name);
        if (value) {
            return value;
        }

        const builtin = Builtins.get(ident.name);
        if (builtin) {
            return builtin;
        }

        return new ErrorObj(`identifier not found: ${ident.name}`);
    }

    evaluateLetStatement(stmt: Let, env: ProgramEnvironment): IObject {
        const value = this.evaluate(stmt.expr, env);
        if (value instanceof ErrorObj) {
            return value;
        }

        env.set(stmt.ident.name, value);
        return NULL;
    }

    evaluateReturnStatement(stmt: Return, env: ProgramEnvironment): IObject {
        const obj = this.evaluate(stmt.expr, env);
        if (obj instanceof ErrorObj) {
            return obj;
        }
        return new ReturnObj(obj);
    }

    evaluateIfExpresion(expr: IfExpression, env: ProgramEnvironment): IObject {
        const conditionObj = this.evaluate(expr.condition, env);
        if (conditionObj instanceof ErrorObj) {
            return conditionObj;
        }

        if (Evaluator.isTruthy(conditionObj)) {
            return this.evaluateStatements(expr.consequence.stmts, env);
        } else if (expr.alternative) {
            return this.evaluateStatements(expr.alternative.stmts, env);
        }

        return NULL;
    }

    evaluateInfixExpression(
        expr: InfixExpression,
        env: ProgramEnvironment
    ): IObject {
        const left = this.evaluate(expr.left, env);
        if (left instanceof ErrorObj) {
            return left;
        }

        const right = this.evaluate(expr.right, env);
        if (right instanceof ErrorObj) {
            return right;
        }

        // Here we are checking whether the types are compatible.
        // Currently, we support operations only on operands that
        // are of the exact same type.
        if (
            !(
                (left instanceof IntObj && right instanceof IntObj) ||
                (left instanceof StringObj && right instanceof StringObj) ||
                (left instanceof BooleanObj && right instanceof BooleanObj)
            )
        ) {
            return Evaluator.getIncompatibleTypesError(
                left,
                expr.operator,
                right
            );
        } else {
            switch (expr.operator) {
                case '+':
                    return this.evaluateInfixPlus(left, right, expr.operator);
                case '-':
                    return this.evaluateInfixMinus(left, right, expr.operator);
                case '*':
                    return this.evaluateInfixAsterisk(
                        left,
                        right,
                        expr.operator
                    );
                case '/':
                    return this.evaluateInfixSlash(left, right, expr.operator);
                case '%':
                    return this.evaluateInfixReminder(
                        left,
                        right,
                        expr.operator
                    );
                case '||':
                    return this.evaluateInfixOr(left, right, expr.operator);
                case '&&':
                    return this.evaluateInfixAnd(left, right, expr.operator);
                case '>':
                    return this.evaluateInfixGreaterThan(
                        left,
                        right,
                        expr.operator
                    );
                case '>=':
                    return this.evaluateInfixGreaterThanOrEqual(
                        left,
                        right,
                        expr.operator
                    );
                case '<':
                    return this.evaluateInfixLessThan(
                        left,
                        right,
                        expr.operator
                    );
                case '<=':
                    return this.evaluateInfixLessThanOrEqual(
                        left,
                        right,
                        expr.operator
                    );
                case '==':
                    return this.evaluateInfixEqual(left, right, expr.operator);
                case '!=':
                    return this.evaluateInfixNotEqual(
                        left,
                        right,
                        expr.operator
                    );
                default:
                    return Evaluator.getUnknownInfixOperatorError(
                        left,
                        expr.operator,
                        right
                    );
            }
        }
    }

    evaluateInfixNotEqual(
        left: IObject,
        right: IObject,
        operator: string
    ): IObject {
        if (
            (left instanceof IntObj && right instanceof IntObj) ||
            (left instanceof BooleanObj && right instanceof BooleanObj)
        ) {
            return Evaluator.nativeBooleanToBooleanObject(
                left.value != right.value
            );
        } else {
            return Evaluator.getUnknownInfixOperatorError(
                left,
                operator,
                right
            );
        }
    }

    evaluateInfixEqual(
        left: IObject,
        right: IObject,
        operator: string
    ): IObject {
        if (
            (left instanceof IntObj && right instanceof IntObj) ||
            (left instanceof BooleanObj && right instanceof BooleanObj)
        ) {
            return Evaluator.nativeBooleanToBooleanObject(
                left.value == right.value
            );
        } else {
            return Evaluator.getUnknownInfixOperatorError(
                left,
                operator,
                right
            );
        }
    }

    evaluateInfixLessThanOrEqual(
        left: IObject,
        right: IObject,
        operator: string
    ): IObject {
        if (left instanceof IntObj && right instanceof IntObj) {
            return Evaluator.nativeBooleanToBooleanObject(
                left.value <= right.value
            );
        } else {
            return Evaluator.getUnknownInfixOperatorError(
                left,
                operator,
                right
            );
        }
    }

    evaluateInfixLessThan(
        left: IObject,
        right: IObject,
        operator: string
    ): IObject {
        if (left instanceof IntObj && right instanceof IntObj) {
            return Evaluator.nativeBooleanToBooleanObject(
                left.value < right.value
            );
        } else {
            return Evaluator.getUnknownInfixOperatorError(
                left,
                operator,
                right
            );
        }
    }

    evaluateInfixGreaterThanOrEqual(
        left: IObject,
        right: IObject,
        operator: string
    ): IObject {
        if (left instanceof IntObj && right instanceof IntObj) {
            return Evaluator.nativeBooleanToBooleanObject(
                left.value >= right.value
            );
        } else {
            return Evaluator.getUnknownInfixOperatorError(
                left,
                operator,
                right
            );
        }
    }

    evaluateInfixGreaterThan(
        left: IObject,
        right: IObject,
        operator: string
    ): IObject {
        if (left instanceof IntObj && right instanceof IntObj) {
            return Evaluator.nativeBooleanToBooleanObject(
                left.value > right.value
            );
        } else {
            return Evaluator.getUnknownInfixOperatorError(
                left,
                operator,
                right
            );
        }
    }

    evaluateInfixOr(left: IObject, right: IObject, operator: string): IObject {
        if (left instanceof BooleanObj && right instanceof BooleanObj) {
            return Evaluator.nativeBooleanToBooleanObject(
                left.value || right.value
            );
        } else {
            return Evaluator.getUnknownInfixOperatorError(
                left,
                operator,
                right
            );
        }
    }

    evaluateInfixAnd(left: IObject, right: IObject, operator: string): IObject {
        if (left instanceof BooleanObj && right instanceof BooleanObj) {
            return Evaluator.nativeBooleanToBooleanObject(
                left.value && right.value
            );
        } else {
            return Evaluator.getUnknownInfixOperatorError(
                left,
                operator,
                right
            );
        }
    }

    evaluateInfixPlus(
        left: IObject,
        right: IObject,
        operator: string
    ): IObject {
        if (left instanceof IntObj && right instanceof IntObj) {
            return new IntObj(left.value + right.value);
        } else if (left instanceof StringObj && right instanceof StringObj) {
            return new StringObj(left.value + right.value);
        } else {
            return Evaluator.getUnknownInfixOperatorError(
                left,
                operator,
                right
            );
        }
    }

    evaluateInfixMinus(
        left: IObject,
        right: IObject,
        operator: string
    ): IObject {
        if (left instanceof IntObj && right instanceof IntObj) {
            return new IntObj(left.value - right.value);
        } else {
            return Evaluator.getUnknownInfixOperatorError(
                left,
                operator,
                right
            );
        }
    }

    evaluateInfixAsterisk(
        left: IObject,
        right: IObject,
        operator: string
    ): IObject {
        if (left instanceof IntObj && right instanceof IntObj) {
            return new IntObj(left.value * right.value);
        } else {
            return Evaluator.getUnknownInfixOperatorError(
                left,
                operator,
                right
            );
        }
    }

    evaluateInfixSlash(
        left: IObject,
        right: IObject,
        operator: string
    ): IObject {
        if (left instanceof IntObj && right instanceof IntObj) {
            return new IntObj(left.value / right.value);
        } else {
            return Evaluator.getUnknownInfixOperatorError(
                left,
                operator,
                right
            );
        }
    }

    evaluateInfixReminder(
        left: IObject,
        right: IObject,
        operator: string
    ): IObject {
        if (left instanceof IntObj && right instanceof IntObj) {
            return new IntObj(left.value % right.value);
        } else {
            return Evaluator.getUnknownInfixOperatorError(
                left,
                operator,
                right
            );
        }
    }

    evaluatePrefixExpression(
        expr: PrefixExpression,
        env: ProgramEnvironment
    ): IObject {
        const right = this.evaluate(expr.expr, env);
        if (right instanceof ErrorObj) {
            return right;
        }

        switch (expr.operator) {
            case '!':
                if (right instanceof BooleanObj) {
                    return right.value ? FALSE : TRUE;
                } else if (right instanceof IntObj) {
                    return right.value === 0 ? TRUE : FALSE;
                } else {
                    return Evaluator.getUnknownPrefixOperatorError(
                        expr.operator,
                        right
                    );
                }
            case '-':
                if (right instanceof IntObj) {
                    return right.value === 0
                        ? new IntObj(0)
                        : new IntObj(-right.value);
                } else {
                    return Evaluator.getUnknownPrefixOperatorError(
                        expr.operator,
                        right
                    );
                }
            default:
                return Evaluator.getUnknownPrefixOperatorError(
                    expr.operator,
                    right
                );
        }
    }

    evaluateProgram(stmts: IStatement[], env: ProgramEnvironment): IObject {
        let result: IObject = NULL;

        for (const stmt of stmts) {
            result = this.evaluate(stmt, env);
            if (result instanceof ReturnObj) {
                return result.value;
            }
            if (result instanceof ErrorObj) {
                return result;
            }
        }

        return result;
    }

    evaluateStatements(stmts: IStatement[], env: ProgramEnvironment): IObject {
        let result: IObject = NULL;

        for (const stmt of stmts) {
            result = this.evaluate(stmt, env);
            if (result instanceof ReturnObj || result instanceof ErrorObj) {
                return result;
            }
        }

        return result;
    }

    static nativeBooleanToBooleanObject(input: boolean): BooleanObj {
        if (input) {
            return TRUE;
        }
        return FALSE;
    }

    static getIncompatibleTypesError(
        left: IObject,
        operator: string,
        right: IObject
    ): ErrorObj {
        return new ErrorObj(
            `type mismatch: ${left.getType()} ${operator} ${right.getType()}`
        );
    }

    static getUnrecognizedStatementError(node: INode): ErrorObj {
        return new ErrorObj(`unrecognized statement error ${node.toString()}`);
    }

    static getExpressionEvaluationFailedError(expr: IExpression): ErrorObj {
        return new ErrorObj(
            `failed to evaluate expression '${expr.toString()}'`
        );
    }

    static getUnknownInfixOperatorError(
        left: IObject,
        operator: string,
        right: IObject
    ): ErrorObj {
        return new ErrorObj(
            `unknown operator: ${left.getType()} ${operator} ${right.getType()}`
        );
    }

    static getUnknownPrefixOperatorError(
        operator: string,
        right: IObject
    ): ErrorObj {
        return new ErrorObj(`unknown operator: ${operator}${right.getType()}`);
    }

    static isTruthy(obj: IObject): boolean {
        switch (obj) {
            case TRUE:
                return true;
            case FALSE:
                return false;
            case NULL:
                return false;
            default:
                return true;
        }
    }
}
