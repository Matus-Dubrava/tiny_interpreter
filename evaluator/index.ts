import { BooleanObj, ErrorObj, IObject, IntObj, NullObj } from '../object';
import {
    INode,
    IntLiteral,
    Program,
    ExpressionStatement,
    IStatement,
    BooleanLiteral,
    PrefixExpression,
    IExpression,
} from '../ast';

const TRUE = new BooleanObj(true);
const FALSE = new BooleanObj(false);
const NULL = new NullObj();

export function evaluate(node: INode): IObject | null {
    if (node instanceof Program) {
        return evaluateStatements(node.stmts);
    } else if (node instanceof ExpressionStatement) {
        return evaluate(node.expr);
    } else if (node instanceof IntLiteral) {
        return new IntObj(node.value);
    } else if (node instanceof BooleanLiteral) {
        return nativeBooleanToBooleanObject(node.value);
    } else if (node instanceof PrefixExpression) {
        const right = evaluate(node.expr);
        if (right) {
            return evaluatePrefixExpression(right, node.operator);
        }
    }

    return null;
}

function evaluatePrefixExpression(expr: IObject, operator: string): IObject {
    if (expr instanceof BooleanObj) {
        if (operator === '!') {
            return expr.value ? FALSE : TRUE;
        } else {
            return new ErrorObj(
                `unknown operator '${operator}' in expression '${expr.toString()}'`
            );
        }
    } else if (expr instanceof IntObj) {
        switch (operator) {
            case '-':
                return new IntObj(-expr.value);
            case '!': {
                return expr.value === 0 ? TRUE : FALSE;
            }
            default:
                return new ErrorObj(
                    `unkown operator '${operator}' in expression '${expr.toString()}'`
                );
        }
    } else {
        return new ErrorObj(`invalid expression '${expr.toString()}'`);
    }
}

function evaluateStatements(stmts: IStatement[]): IObject | null {
    let result: IObject | null = null;
    stmts.forEach((stmt) => {
        result = evaluate(stmt);
    });
    return result;
}

function nativeBooleanToBooleanObject(input: boolean): BooleanObj {
    if (input) {
        return TRUE;
    }
    return FALSE;
}
