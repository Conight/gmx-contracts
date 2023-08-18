// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../tokens/MintableBaseToken.sol";

contract EsGMX is MintableBaseToken {
    constructor() public MintableBaseToken("Escrowed Tao", "esTao", 0) {
    }

    function id() external pure returns (string memory _name) {
        return "esTao";
    }
}
