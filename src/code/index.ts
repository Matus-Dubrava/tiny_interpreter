export type Instructions = Uint8Array[];
export type Opcode = number;

export const Opcodes = {
    OpConstant: 0,
} as const;

export type Definition = {
    name: string;
    operandWidths: number[];
};

let definitions: Map<Opcode, Definition> = new Map<Opcode, Definition>();
definitions.set(Opcodes.OpConstant, { name: 'OpConstant', operandWidths: [2] });

function lookup(op: number): Definition | Error {
    const def = definitions.get(op);
    if (!def) {
        return new Error(`opcode ${op} undefined`);
    }
    return def;
}

export function make(op: Opcode, ...operands: number[]): Uint8Array {
    let def = lookup(op);
    if (!def) {
        return new Uint8Array(0);
    }
    def = def as Definition;

    let instructionLen = 1;
    def.operandWidths.forEach((w) => {
        instructionLen += w;
    });

    const instruction = new Uint8Array(instructionLen);
    instruction[0] = op;

    let offset = 1;
    for (let i = 0; i < operands.length; i++) {
        const width = def.operandWidths[i];
        switch (width) {
            case 2:
                new DataView(instruction.buffer).setInt16(
                    offset,
                    operands[i],
                    false
                );
                break;
        }
        offset += width;
    }

    return instruction;
}
