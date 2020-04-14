import { TreeNode } from "./parser";

export let asmCode: string[];
let labelCounter = 0;

export function makeAsm(root: TreeNode) {
    asmCode = [];
    labelCounter = 0;
    emit("default rel");
    emit("section .text");
    emit("global main");
    emit("main:");
    programNodeCode(root);
    emit("ret");
    emit("section .data");
    return asmCode.join("\n");
}

function ICE() {
    //internal compiler error
    let errorMsg: string = "\tInternal Compiler Error!";
    console.log(errorMsg);
    throw new Error(errorMsg);
}

function emit(instr: string) {
    asmCode.push(instr);
}

function programNodeCode(n: TreeNode) {
    //program -> braceblock
    if (n.sym != "program")
        ICE();
    braceblockNodeCode(n.children[0]);
}

function braceblockNodeCode(n: TreeNode) {
    //braceblock -> LBR stmts RBR
    stmtsNodeCode(n.children[1]);
}

function stmtsNodeCode(n: TreeNode) {
    //stmts -> stmt stmts | lambda
    if (n.children.length == 0)
        return;
    stmtNodeCode(n.children[0]);
    stmtsNodeCode(n.children[1]);
}

function stmtNodeCode(n: TreeNode) {
    //stmt -> cond | loop | return-stmt SEMI
    let c = n.children[0];
    switch (c.sym) {
        case "cond":
            condNodeCode(c); break;
        case "loop":
            loopNodeCode(c); break;
        case "return-stmt":
            returnstmtNodeCode(c); break;
        default:
            ICE();
    }
}

function returnstmtNodeCode(n: TreeNode) {
    //return-stmt -> RETURN expr
    exprNodeCode(n.children[1]);
    emit("ret");
}

function exprNodeCode(n: TreeNode) {
    //expr -> NUM
    let d = parseInt(n.children[0].token.lexeme, 10);
    emit(`mov rax, ${d}`);
}

function loopNodeCode(n: TreeNode) {
    //loop -> WHILE LP cond RP braceblock
    var startWhileLabel = label();
    var endWhileLabel = label();

    emit(`${startWhileLabel}:`);
    exprNodeCode(n.children[2]);
    emit("cmp rax, 0");
    emit(`je ${endWhileLabel}`);
    //if the comparison is false then we break out of while loop
    braceblockNodeCode(n.children[4]);
    emit(`jmp ${startWhileLabel}`);
    //we need to go back to top of while loop no matter what
    emit(`${endWhileLabel}:`);
}

function condNodeCode(n: TreeNode) {
    //cond -> IF LP expr RP braceblock |
    //IF LP expr RP braceblock ELSE braceblock

    if (n.children.length === 5) {
        //no 'else'
        exprNodeCode(n.children[2]);    //leaves result in rax
        emit("cmp rax, 0");
        var endifLabel = label();
        emit(`je ${endifLabel}`);
        braceblockNodeCode(n.children[4]);
        emit(`${endifLabel}:`);
    } else {

        var endIf = label();
        var endElse = label();

        exprNodeCode(n.children[2]);    //leaves result in rax
        emit("cmp rax, 0");
        //if comparison == false, then jump to else block
        emit(`je ${endIf}`);
        //this is the if block
        braceblockNodeCode(n.children[4]);
        emit(`jmp ${endElse}`);
        emit(`${endIf}:`);

        //this is the else block
        braceblockNodeCode(n.children[6]);
        emit(`${endElse}:`);
    }
}

function label() {
    let s = "lbl" + labelCounter;
    labelCounter++;
    return s;
}