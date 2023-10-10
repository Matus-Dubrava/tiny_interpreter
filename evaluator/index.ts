import { BooleanObj, ErrorObj, IObject, IntObj, NullObj } from '../object';
import {
    INode,
    IntLiteral,
    Program,
    ExpressionStatement,
    IStatement,
    BooleanLiteral,
    PrefixExpression,
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
            return evaluateInfixPlus(left, right, operator);
        case '-':
            return evaluateInfixMinus(left, right, operator);
        case '*':
            return evaluateInfixAsterisk(left, right, operator);
        case '/':
            return evaluateInfixSlash(left, right, operator);
        case '%':
            return evaluateInfixReminder(left, right, operator);
        case '||':
            return evaluateInfixOr(left, right, operator);
        case '&&':
            return evaluateInfixAnd(left, right, operator);
        case '>':
            return evaluateInfixGreaterThan(left, right, operator);
        case '>=':
            return evaluateInfixGreaterThanOrEqual(left, right, operator);
        case '<':
            return evaluateInfixLessThan(left, right, operator);
        case '<=':
            return evaluateInfixLessThanOrEqual(left, right, operator);
        case '==':
            return evaluateInfixEqual(left, right, operator);
        case '!=':
            return evaluateInfixNotEqual(left, right, operator);
        default:
            return new ErrorObj(`unknown infix operator '${operator}'`);
    }
}

function evaluateInfixNotEqual(
    left: IObject,
    right: IObject,
    operator: string
): IObject {
    if (
        (left instanceof IntObj && right instanceof IntObj) ||
        (left instanceof BooleanObj && right instanceof BooleanObj)
    ) {
        return nativeBooleanToBooleanObject(left.value != right.value);
    } else {
        return getIncompatibleInfixTypesError(left, right, operator);
    }
}

function evaluateInfixEqual(
    left: IObject,
    right: IObject,
    operator: string
): IObject {
    if (
        (left instanceof IntObj && right instanceof IntObj) ||
        (left instanceof BooleanObj && right instanceof BooleanObj)
    ) {
        return nativeBooleanToBooleanObject(left.value == right.value);
    } else {
        return getIncompatibleInfixTypesError(left, right, operator);
    }
}

function evaluateInfixLessThanOrEqual(
    left: IObject,
    right: IObject,
    operator: string
): IObject {
    if (left instanceof IntObj && right instanceof IntObj) {
        return nativeBooleanToBooleanObject(left.value <= right.value);
    } else {
        return getIncompatibleInfixTypesError(left, right, operator);
    }
}

function evaluateInfixLessThan(
    left: IObject,
    right: IObject,
    operator: string
): IObject {
    if (left instanceof IntObj && right instanceof IntObj) {
        return nativeBooleanToBooleanObject(left.value < right.value);
    } else {
        return getIncompatibleInfixTypesError(left, right, operator);
    }
}

function evaluateInfixGreaterThanOrEqual(
    left: IObject,
    right: IObject,
    operator: string
): IObject {
    if (left instanceof IntObj && right instanceof IntObj) {
        return nativeBooleanToBooleanObject(left.value >= right.value);
    } else {
        return getIncompatibleInfixTypesError(left, right, operator);
    }
}

function evaluateInfixGreaterThan(
    left: IObject,
    right: IObject,
    operator: string
): IObject {
    if (left instanceof IntObj && right instanceof IntObj) {
        return nativeBooleanToBooleanObject(left.value > right.value);
    } else {
        return getIncompatibleInfixTypesError(left, right, operator);
    }
}

function evaluateInfixOr(
    left: IObject,
    right: IObject,
    operator: string
): IObject {
    if (left instanceof BooleanObj && right instanceof BooleanObj) {
        return nativeBooleanToBooleanObject(left.value || right.value);
    } else {
        return getIncompatibleInfixTypesError(left, right, operator);
    }
}

function evaluateInfixAnd(
    left: IObject,
    right: IObject,
    operator: string
): IObject {
    if (left instanceof BooleanObj && right instanceof BooleanObj) {
        return nativeBooleanToBooleanObject(left.value && right.value);
    } else {
        return getIncompatibleInfixTypesError(left, right, operator);
    }
}

function evaluateInfixPlus(
    left: IObject,
    right: IObject,
    operator: string
): IObject {
    if (left instanceof IntObj && right instanceof IntObj) {
        return new IntObj(left.value + right.value);
    } else {
        return getIncompatibleInfixTypesError(left, right, operator);
    }
}

function evaluateInfixMinus(
    left: IObject,
    right: IObject,
    operator: string
): IObject {
    if (left instanceof IntObj && right instanceof IntObj) {
        return new IntObj(left.value - right.value);
    } else {
        return getIncompatibleInfixTypesError(left, right, operator);
    }
}

function evaluateInfixAsterisk(
    left: IObject,
    right: IObject,
    operator: string
): IObject {
    if (left instanceof IntObj && right instanceof IntObj) {
        return new IntObj(left.value * right.value);
    } else {
        return getIncompatibleInfixTypesError(left, right, operator);
    }
}

function evaluateInfixSlash(
    left: IObject,
    right: IObject,
    operator: string
): IObject {
    if (left instanceof IntObj && right instanceof IntObj) {
        return new IntObj(left.value / right.value);
    } else {
        return getIncompatibleInfixTypesError(left, right, operator);
    }
}

function evaluateInfixReminder(
    left: IObject,
    right: IObject,
    operator: string
): IObject {
    if (left instanceof IntObj && right instanceof IntObj) {
        return new IntObj(left.value % right.value);
    } else {
        return getIncompatibleInfixTypesError(left, right, operator);
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

function getIncompatibleInfixTypesError(
    left: IObject,
    right: IObject,
    operator: string
): ErrorObj {
    return new ErrorObj(
        `cannot apply '${operator}' on '${left.getType()}' and '${right.getType()}'`
    );
}
