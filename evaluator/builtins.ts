import { ErrorObj, IObject, BuiltinObj, StringObj, IntObj } from '../object';

export const Builtins: Map<string, BuiltinObj> = new Map<string, BuiltinObj>();

Builtins.set(
    'len',
    new BuiltinObj((...args: IObject[]): IObject => {
        if (args.length !== 1) {
            return new ErrorObj(
                `wrong number of arguments. got=${args.length}, expected=1`
            );
        }

        if (!(args[0] instanceof StringObj)) {
            return new ErrorObj(
                `argument to 'len' not supported, got ${args[0].getType()}`
            );
        }

        return new IntObj((args[0] as StringObj).value.length);
    })
);
