"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseDepositPath = chooseDepositPath;
function chooseDepositPath(params) {
    return params.payMint === params.productMint ? "direct" : "swap";
}
