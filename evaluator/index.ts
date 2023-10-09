import { BooleanObj, IObject, IntObj } from '../object';
import {
    INode,
    IntLiteral,
    Program,
    ExpressionStatement,
    IStatement,
    BooleanLiteral,
} from '../ast';

export function evaluate(node: INode): IObject | null {
    if (node instanceof Program) {
        return evaluateStatements(node.stmts);
    } else if (node instanceof ExpressionStatement) {
        return evaluate(node.expr);
    } else if (node instanceof IntLiteral) {
        return new IntObj(node.value);
    } else if (node instanceof BooleanLiteral) {
        return new BooleanObj(node.value);
    }

    return null;
}

function evaluateStatements(stmts: IStatement[]): IObject | null {
    let result: IObject | null = null;
    stmts.forEach((stmt) => {
        result = evaluate(stmt);
    });
    return result;
}
