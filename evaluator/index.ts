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
    const expr = evaluate(stmt.expr);
    if (!expr) {
        return getExpressionEvaluationFailedError(expr);
    }
    return new ReturnObj(expr);
}

function evaluateIfExpresion(expr: IfExpression): IObject {
    const evaluatedCondition = evaluate(expr.condition);
    if (!evaluatedCondition) {
        return getExpressionEvaluationFailedError(expr.condition);
    }

    if (isTruthy(evaluatedCondition)) {
        return evaluateStatements(expr.consequence.stmts);
    } else if (expr.alternative) {
        return evaluateStatements(expr.alternative.stmts);
    }

    return NULL;
}

function evaluateInfixExpression(expr: InfixExpression): IObject {
    const left = evaluate(expr.left);
    const right = evaluate(expr.right);
    if (!left) {
        return getExpressionEvaluationFailedError(expr.left);
    } else if (!right) {
        return getExpressionEvaluationFailedError(expr.right);
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
                return getUnknownOperatorError(expr.operator);
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
        return getIncompatibleOperatorError(left, operator, right);
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
        return getIncompatibleOperatorError(left, operator, right);
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
        return getIncompatibleOperatorError(left, operator, right);
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
        return getIncompatibleOperatorError(left, operator, right);
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
        return getIncompatibleOperatorError(left, operator, right);
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
        return getIncompatibleOperatorError(left, operator, right);
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
        return getIncompatibleOperatorError(left, operator, right);
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
        return getIncompatibleOperatorError(left, operator, right);
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
        return getIncompatibleOperatorError(left, operator, right);
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
        return getIncompatibleOperatorError(left, operator, right);
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
        return getIncompatibleOperatorError(left, operator, right);
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
        return getIncompatibleOperatorError(left, operator, right);
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
        return getIncompatibleOperatorError(left, operator, right);
    }
}

function evaluatePrefixExpression(expr: PrefixExpression): IObject {
    const right = evaluate(expr.expr);
    if (!right) {
        return getExpressionEvaluationFailedError(expr.expr);
    }

    switch (expr.operator) {
        case '!':
            if (right instanceof BooleanObj) {
                return right.value ? FALSE : TRUE;
            } else if (right instanceof IntObj) {
                return right.value === 0 ? TRUE : FALSE;
            } else {
                return getIncompatibleOperatorError(right, expr.operator);
            }
        case '-':
            if (right instanceof IntObj) {
                return right.value === 0
                    ? new IntObj(0)
                    : new IntObj(-right.value);
            } else {
                return getIncompatibleOperatorError(right, expr.operator);
            }
        default:
            return getUnknownOperatorError(expr.operator);
    }
}

function evaluateProgram(stmts: IStatement[]): IObject {
    let result: IObject = NULL;

    for (const stmt of stmts) {
        result = evaluate(stmt);
        if (result instanceof ReturnObj) {
            return result.value;
        }
    }

    return result;
}

function evaluateStatements(stmts: IStatement[]): IObject {
    let result: IObject = NULL;

    for (const stmt of stmts) {
        result = evaluate(stmt);
        if (result instanceof ReturnObj) {
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

function getIncompatibleOperatorError(
    left: IObject,
    operator: string,
    right: IObject | null = null
): ErrorObj {
    const msg = right
        ? `cannot apply '${operator}' on '${left.getType()}' and '${right.getType()}'`
        : `cannot apply '${operator}' on '${left.getType()}'`;

    return new ErrorObj(msg);
}

function getUnrecognizedStatementError(node: INode): ErrorObj {
    return new ErrorObj(`unrecognized statement error ${node.toString()}`);
}

function getExpressionEvaluationFailedError(expr: IExpression): ErrorObj {
    return new ErrorObj(`failed to evaluate expression '${expr.toString()}'`);
}

function getUnknownOperatorError(operator: string): ErrorObj {
    return new ErrorObj(`unknown operator '${operator}'`);
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
