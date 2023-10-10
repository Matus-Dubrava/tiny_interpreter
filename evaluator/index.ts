import {
    BooleanObj,
    ErrorObj,
    FunctionObject,
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
    Let,
    IStatement,
    BooleanLiteral,
    PrefixExpression,
    InfixExpression,
    IfExpression,
    BlockStatement,
    IExpression,
    Return,
    Identifier,
    FunctionLiteral,
} from '../ast';
import { ProgramEnvironment } from '../object/environment';

const TRUE = new BooleanObj(true);
const FALSE = new BooleanObj(false);
const NULL = new NullObj();

export function evaluate(node: INode, env: ProgramEnvironment): IObject {
    if (node instanceof Program) {
        return evaluateProgram(node.stmts, env);
    } else if (node instanceof BlockStatement) {
        return evaluateStatements(node.stmts, env);
    } else if (node instanceof ExpressionStatement) {
        return evaluate(node.expr, env);
    } else if (node instanceof IntLiteral) {
        return new IntObj(node.value);
    } else if (node instanceof BooleanLiteral) {
        return nativeBooleanToBooleanObject(node.value);
    } else if (node instanceof PrefixExpression) {
        return evaluatePrefixExpression(node, env);
    } else if (node instanceof InfixExpression) {
        return evaluateInfixExpression(node, env);
    } else if (node instanceof IfExpression) {
        return evaluateIfExpresion(node, env);
    } else if (node instanceof Return) {
        return evaluateReturnStatement(node, env);
    } else if (node instanceof Let) {
        return evaluateLetStatement(node, env);
    } else if (node instanceof Identifier) {
        return evaluateIdentifier(node, env);
    } else if (node instanceof FunctionLiteral) {
        return evaluateFunction(node, env);
    }

    return getUnrecognizedStatementError(node);
}

function evaluateFunction(
    fn: FunctionLiteral,
    env: ProgramEnvironment
): IObject {
    return new FunctionObject(fn.parameters, fn.body, env);
}

function evaluateIdentifier(
    ident: Identifier,
    env: ProgramEnvironment
): IObject {
    const value = env.get(ident.name);
    return value ? value : new ErrorObj(`identifier not found: ${ident.name}`);
}

function evaluateLetStatement(stmt: Let, env: ProgramEnvironment): IObject {
    const value = evaluate(stmt.expr, env);
    if (value instanceof ErrorObj) {
        return value;
    }

    env.set(stmt.ident.name, value);
    return NULL;
}

function evaluateReturnStatement(
    stmt: Return,
    env: ProgramEnvironment
): IObject {
    const obj = evaluate(stmt.expr, env);
    if (obj instanceof ErrorObj) {
        return obj;
    }
    return new ReturnObj(obj);
}

function evaluateIfExpresion(
    expr: IfExpression,
    env: ProgramEnvironment
): IObject {
    const conditionObj = evaluate(expr.condition, env);
    if (conditionObj instanceof ErrorObj) {
        return conditionObj;
    }

    if (isTruthy(conditionObj)) {
        return evaluateStatements(expr.consequence.stmts, env);
    } else if (expr.alternative) {
        return evaluateStatements(expr.alternative.stmts, env);
    }

    return NULL;
}

function evaluateInfixExpression(
    expr: InfixExpression,
    env: ProgramEnvironment
): IObject {
    const left = evaluate(expr.left, env);
    if (left instanceof ErrorObj) {
        return left;
    }

    const right = evaluate(expr.right, env);
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

function evaluatePrefixExpression(
    expr: PrefixExpression,
    env: ProgramEnvironment
): IObject {
    const right = evaluate(expr.expr, env);
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

function evaluateProgram(
    stmts: IStatement[],
    env: ProgramEnvironment
): IObject {
    let result: IObject = NULL;

    for (const stmt of stmts) {
        result = evaluate(stmt, env);
        if (result instanceof ReturnObj) {
            return result.value;
        }
        if (result instanceof ErrorObj) {
            return result;
        }
    }

    return result;
}

function evaluateStatements(
    stmts: IStatement[],
    env: ProgramEnvironment
): IObject {
    let result: IObject = NULL;

    for (const stmt of stmts) {
        result = evaluate(stmt, env);
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
