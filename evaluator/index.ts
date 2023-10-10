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
    InfixExpression,
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
            return evaluatePrefixExpression(node.operator, right);
        }
        // do we want to return null or error here
        return null;
    } else if (node instanceof InfixExpression) {
        const left = evaluate(node.left);
        const right = evaluate(node.right);
        if (left && right) {
            return evaluateInfixExpression(left, node.operator, right);
        }
        // do we want to return null or error here
        return null;
    }

    return null;
}

function evaluateInfixExpression(
    left: IObject,
    operator: string,
    right: IObject
): IObject {
    switch (operator) {
        case '+':
            return evaluateInfixPlus(left, right);
        case '-':
            return evaluateInfixMinus(left, right);
        case '*':
            return evaluateInfixAsterisk(left, right);
        case '/':
            return evaluateInfixSlash(left, right);
        case '%':
            return evaluateInfixReminder(left, right);
        case '||':
            return evaluateInfixOr(left, right);
        case '&&':
            return evaluateInfixAnd(left, right);
        default:
            return new ErrorObj(`unknown infix operator '${operator}'`);
    }
}

function evaluateInfixOr(left: IObject, right: IObject): IObject {
    if (left instanceof BooleanObj && right instanceof BooleanObj) {
        return new BooleanObj(left.value || right.value);
    } else {
        return new ErrorObj(
            `cannot apply '||' on '${left.getType()}' and '${right.getType()}'`
        );
    }
}

function evaluateInfixAnd(left: IObject, right: IObject): IObject {
    if (left instanceof BooleanObj && right instanceof BooleanObj) {
        return new BooleanObj(left.value && right.value);
    } else {
        return new ErrorObj(
            `cannot apply '&&' on '${left.getType()}' and '${right.getType()}'`
        );
    }
}

function evaluateInfixPlus(left: IObject, right: IObject): IObject {
    if (left instanceof IntObj && right instanceof IntObj) {
        return new IntObj(left.value + right.value);
    } else {
        return new ErrorObj(
            `cannot apply '+' on '${left.getType()}' and '${right.getType()}'`
        );
    }
}

function evaluateInfixMinus(left: IObject, right: IObject): IObject {
    if (left instanceof IntObj && right instanceof IntObj) {
        return new IntObj(left.value - right.value);
    } else {
        return new ErrorObj(
            `cannot apply '-' on '${left.getType()}' and '${right.getType()}'`
        );
    }
}

function evaluateInfixAsterisk(left: IObject, right: IObject): IObject {
    if (left instanceof IntObj && right instanceof IntObj) {
        return new IntObj(left.value * right.value);
    } else {
        return new ErrorObj(
            `cannot apply '*' on '${left.getType()}' and '${right.getType()}'`
        );
    }
}

function evaluateInfixSlash(left: IObject, right: IObject): IObject {
    if (left instanceof IntObj && right instanceof IntObj) {
        return new IntObj(left.value / right.value);
    } else {
        return new ErrorObj(
            `cannot apply '/' on '${left.getType()}' and '${right.getType()}'`
        );
    }
}

function evaluateInfixReminder(left: IObject, right: IObject): IObject {
    if (left instanceof IntObj && right instanceof IntObj) {
        return new IntObj(left.value % right.value);
    } else {
        return new ErrorObj(
            `cannot apply '%' on '${left.getType()}' and '${right.getType()}'`
        );
    }
}

function evaluatePrefixExpression(operator: string, right: IObject): IObject {
    if (right instanceof BooleanObj) {
        if (operator === '!') {
            return right.value ? FALSE : TRUE;
        } else {
            return new ErrorObj(
                `unknown operator '${operator}' in expression '${right.getType()}'`
            );
        }
    } else if (right instanceof IntObj) {
        switch (operator) {
            case '-':
                return right.value === 0
                    ? new IntObj(0)
                    : new IntObj(-right.value);
            case '!': {
                return right.value === 0 ? TRUE : FALSE;
            }
            default:
                return new ErrorObj(
                    `unkown operator '${operator}' in expression '${right.getType()}'`
                );
        }
    } else {
        return new ErrorObj(`invalid expression '${right.getType()}'`);
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
