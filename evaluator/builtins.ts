import {
    ErrorObj,
    IObject,
    BuiltinObj,
    StringObj,
    IntObj,
    ArrayObj,
    NULL,
} from '../object';

export const Builtins: Map<string, BuiltinObj> = new Map<string, BuiltinObj>();

Builtins.set(
    'len',
    new BuiltinObj((...args: IObject[]): IObject => {
        if (args.length !== 1) {
            return getWrongNumberOfArgumentsError(args.length, 1);
        }

        if (args[0] instanceof StringObj) {
            return new IntObj((args[0] as StringObj).value.length);
        }

        if (args[0] instanceof ArrayObj) {
            return new IntObj((args[0] as ArrayObj).elements.length);
        }

        return new ErrorObj(
            `argument to 'len' not supported, got ${args[0].getType()}`
        );
    })
);

Builtins.set(
    'first',
    new BuiltinObj((...args: IObject[]): IObject => {
        if (args.length !== 1) {
            return getWrongNumberOfArgumentsError(args.length, 1);
        }

        if (args[0] instanceof StringObj) {
            return args[0].value.length > 0
                ? new StringObj((args[0] as StringObj).value[0])
                : new StringObj('');
        }

        if (args[0] instanceof ArrayObj) {
            return args[0].elements.length > 0
                ? (args[0] as ArrayObj).elements[0]
                : NULL;
        }

        return new ErrorObj(
            `argument to 'first' not supported, got ${args[0].getType()}`
        );
    })
);

Builtins.set(
    'last',
    new BuiltinObj((...args: IObject[]): IObject => {
        if (args.length !== 1) {
            return getWrongNumberOfArgumentsError(args.length, 1);
        }

        if (args[0] instanceof StringObj) {
            return args[0].value.length > 0
                ? new StringObj(
                      (args[0] as StringObj).value[
                          (args[0] as StringObj).value.length - 1
                      ]
                  )
                : new StringObj('');
        }

        if (args[0] instanceof ArrayObj) {
            return args[0].elements.length > 0
                ? (args[0] as ArrayObj).elements[
                      (args[0] as ArrayObj).elements.length - 1
                  ]
                : NULL;
        }

        return new ErrorObj(
            `argument to 'last' not supported, got ${args[0].getType()}`
        );
    })
);

function getWrongNumberOfArgumentsError(
    received: number,
    expected: number
): ErrorObj {
    return new ErrorObj(
        `wrong number of arguments. got=${received}, expected=${expected}`
    );
}
