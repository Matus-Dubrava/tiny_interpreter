interface INode {}

interface IStatement extends INode {
    statementNode(): void;
    toString(): string;
}

class Identifier implements IStatement {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    toString(): string {
        return `Ident: ${this.name}`;
    }

    statementNode(): void {}
}

let stmts: IStatement[] = [];
let ident: Identifier = new Identifier('x');

stmts.push(ident as IStatement);

console.log((stmts[0] as Identifier).name);
