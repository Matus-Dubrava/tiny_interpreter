import { Opcodes, make } from '..';

test('test make', () => {
    const tests = [
        {
            op: Opcodes.OpConstant,
            operands: [65534],
            expected: [Opcodes.OpConstant, 255, 254],
        },
    ];

    tests.forEach(({ op, operands, expected }) => {
        const instruction = make(op, ...operands);
        expect(instruction.length).toEqual(expected.length);
        expected.forEach((b, i) => {
            expect(instruction[i]).toEqual(b);
        });
    });
});
