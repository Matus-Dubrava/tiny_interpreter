import {
    BooleanObj,
    ErrorObj,
    IObject,
    IntObj,
    NullObj,
    ReturnObj,
} from '../object';
import {
    INode,
    IntLiteral,
    Program,
    ExpressionStatement,
    IStatement,
    BooleanLiteral,
    PrefixExpression,
    InfixExpression,
    IfExpression,
    BlockStatement,
    IExpression,
    Return,
} from '../ast';

const TRUE = new BooleanObj(true);
const FALSE = new BooleanObj(false);
const NULL = new NullObj();

export function evaluate(node: INode): IObject {
    if (node instanceof Program) {
        return evaluateProgram(node.stmts);
    } else if (node instanceof BlockStatement) {
        return evaluateStatements(node.stmts);
    } else if (node instanceof ExpressionStatement) {
        return evaluate(node.expr);
    } else if (node instanceof IntLiteral) {
        return new IntObj(node.value);
    } else if (node instanceof BooleanLiteral) {
        return nativeBooleanToBooleanObject(node.value);
    } else if (node instanceof PrefixExpression) {
        return evaluatePrefixExpression(node);
    } else if (node instanceof InfixExpression) {
        return evaluateInfixExpression(node);
    } else if (node instanceof IfExpression) {
        return evaluateIfExpresion(node);
    } else if (node instanceof Return) {
        return evaluateReturnStatement(node);
    }

    return getUnrecognizedStatementError(node);
}

function evaluateReturnStatement(stmt: Return): IObject {
    const obj = evaluate(stmt.expr);
    if (obj instanceof ErrorObj) {
        return obj;
    }
    return new ReturnObj(obj);
}

function evaluateIfExpresion(expr: IfExpression): IObject {
    const conditionObj = evaluate(expr.condition);
    if (conditionObj instanceof ErrorObj) {
        return conditionObj;
    }

    if (isTruthy(conditionObj)) {
        return evaluateStatements(expr.consequence.stmts);
    } else if (expr.alternative) {
        return evaluateStatements(expr.alternative.stmts);
    }

    return NULL;
}

function evaluateInfixExpression(expr: InfixExpression): IObject {
    const left = evaluate(expr.left);
    if (left instanceof ErrorObj) {
        return left;
    }

    const right = evaluate(expr.right);
    if (right instanceof ErrorObj) {
        return right;
    }

    // Here we are checking whether the types are compatible.
    // Right now there are only 2 types - bool & int - which
    // cannot be mixed.
    if (
        !(
            (left instanceof IntObj && right instanceof IntObj) ||
            (left instanceof BooleanObj && right instanceof BooleanObj)
        )
    ) {
        return getIncompatibleTypesError(left, expr.operator, right);
    } else {
        switch (expr.operator) {
            case '+':
                return evaluateInfixPlus(left, right, expr.operator);
            case '-':
                return evaluateInfixMinus(left, right, expr.operator);
            case '*':
                return evaluateInfixAsterisk(left, right, expr.operator);
            case '/':
                return evaluateInfixSlash(left, right, expr.operator);
            case '%':
                return evaluateInfixReminder(left, right, expr.operator);
            case '||':
                return evaluateInfixOr(left, right, expr.operator);
            case '&&':
                return evaluateInfixAnd(left, right, expr.operator);
            case '>':
                return evaluateInfixGreaterThan(left, right, expr.operator);
            case '>=':
                return evaluateInfixGreaterThanOrEqual(
                    left,
                    right,
                    expr.operator
                );
            case '<':
                return evaluateInfixLessThan(left, right, expr.operator);
            case '<=':
                return evaluateInfixLessThanOrEqual(left, right, expr.operator);
            case '==':
                return evaluateInfixEqual(left, right, expr.operator);
            case '!=':
                return evaluateInfixNotEqual(left, right, expr.operator);
            default:
                return getUnknownInfixOperatorError(left, expr.operator, right);
        }
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
        return getUnknownInfixOperatorError(left, operator, right);
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
        return getUnknownInfixOperatorError(left, operator, right);
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
        return getUnknownInfixOperatorError(left, operator, right);
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
        return getUnknownInfixOperatorError(left, operator, right);
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
        return getUnknownInfixOperatorError(left, operator, right);
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
        return getUnknownInfixOperatorError(left, operator, right);
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
        return getUnknownInfixOperatorError(left, operator, right);
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
        return getUnknownInfixOperatorError(left, operator, right);
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
        return getUnknownInfixOperatorError(left, operator, right);
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
        return getUnknownInfixOperatorError(left, operator, right);
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
        return getUnknownInfixOperatorError(left, operator, right);
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
        return getUnknownInfixOperatorError(left, operator, right);
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
        return getUnknownInfixOperatorError(left, operator, right);
    }
}

function evaluatePrefixExpression(expr: PrefixExpression): IObject {
    const right = evaluate(expr.expr);
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
                return getUnknownPrefixOperatorError(expr.operator, right);
            }
        case '-':
            if (right instanceof IntObj) {
                return right.value === 0
                    ? new IntObj(0)
                    : new IntObj(-right.value);
            } else {
                return getUnknownPrefixOperatorError(expr.operator, right);
            }
        default:
            return getUnknownPrefixOperatorError(expr.operator, right);
    }
}

function evaluateProgram(stmts: IStatement[]): IObject {
    let result: IObject = NULL;

    for (const stmt of stmts) {
        result = evaluate(stmt);
        if (result instanceof ReturnObj) {
            return result.value;
        }
        if (result instanceof ErrorObj) {
            return result;
        }
    }

    return result;
}

function evaluateStatements(stmts: IStatement[]): IObject {
    let result: IObject = NULL;

    for (const stmt of stmts) {
        result = evaluate(stmt);
        if (result instanceof ReturnObj || result instanceof ErrorObj) {
            return result;
        }
    }

    return result;
}

function nativeBooleanToBooleanObject(input: boolean): BooleanObj {
    if (input) {
        return TRUE;
    }
    return FALSE;
}

function getIncompatibleTypesError(
    left: IObject,
    operator: string,
    right: IObject
): ErrorObj {
    return new ErrorObj(
        `type mismatch: ${left.getType()} ${operator} ${right.getType()}`
    );
}

function getUnrecognizedStatementError(node: INode): ErrorObj {
    return new ErrorObj(`unrecognized statement error ${node.toString()}`);
}

function getExpressionEvaluationFailedError(expr: IExpression): ErrorObj {
    return new ErrorObj(`failed to evaluate expression '${expr.toString()}'`);
}

function getUnknownInfixOperatorError(
    left: IObject,
    operator: string,
    right: IObject
): ErrorObj {
    return new ErrorObj(
        `unknown operator: ${left.getType()} ${operator} ${right.getType()}`
    );
}

function getUnknownPrefixOperatorError(
    operator: string,
    right: IObject
): ErrorObj {
    return new ErrorObj(`unknown operator: ${operator}${right.getType()}`);
}

function isTruthy(obj: IObject): boolean {
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
