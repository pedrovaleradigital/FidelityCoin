// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

library Strings {
    /**
     * @dev Converts a `uint256` to its ASCII `string` decimal representation.
     */
    function toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT licence
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

contract FidelityNFT is
    ERC721Upgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    function version() external pure returns (string memory) {
        return "1.0";
    }

    using Strings for uint256;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    string ipfsCID;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory _tokenName,
        string memory _tokenSymbol,
        string memory _tokenIpfsCID
    ) public initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _setIpfsCID(_tokenIpfsCID);

        __ERC721_init(_tokenName, _tokenSymbol);
        __AccessControl_init();
        __UUPSUpgradeable_init();
    }

    function _setIpfsCID(string memory _ipfsCID) internal {
        ipfsCID = _ipfsCID;
    }

    function _getIpfsCID() internal view returns (string storage) {
        return ipfsCID;
    }

    function _baseURI() internal view override returns (string memory) {
        return string(abi.encodePacked("ipfs://", _getIpfsCID(), "/"));
    }

    function safeMint(address to, uint256 id)
        public
        onlyRole(MINTER_ROLE)
    {
        // Se hacen dos validaciones
        // 1 - Dicho id no haya sido acuñado antes
        require(_ownerOf(id) == address(0), "Token is already minted");
        // 2 - Id se encuentre en el rando inclusivo de 1 a 30
        //      * Mensaje de error: "Public Sale: id must be between 1 and 30"
        require(id >= 1 && id <= 30, "NFT: Token id out of range");
        _safeMint(to, id);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "No existe Token.");
        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    tokenId.toString(),
                    ".json"
                )
            );
    }

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}
}
