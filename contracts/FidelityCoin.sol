// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract FidelityCoin is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    //PARA CALCULAR FIDOS POR NFT = VALOR PRODUCTO EN SOLES / 0.04
    //PARA COMPRAR FIDOS: MINIMO 500 FIDOS, VALOR EN ETH CALCULADO A PARTIR DE S/ 0.10 POR FIDO
    //500 FIDO = 0.007814 ETH
    //Para Materializar usuario debe pagar 0.0025 ETH

    //NFT IPFS Metadata (52 Items): QmSA58qFqb8m66e4vCWx6UcJAuq7Lt3zLU8EyGDXwDyCTc
    /*    function version() external pure returns (string memory) {
        return "1.0";
    }*/

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    mapping (address => uint256) internal _balanceExpiration;
    uint256 internal _expirationPeriod;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        /*string memory _tokenName,
        string memory _tokenSymbol,
        uint256 _expirationPeriod*/
    ) public initializer {
        __ERC20_init("FidelityCoin", "FIDO");
        __ERC20Burnable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _setExpirationPeriod(60);//Default 60 seconds to expire

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    function _burnIfExpired(address account) internal {
        if (block.timestamp >= _balanceExpiration[account]) {
            _burn(account, super.balanceOf(account));
        }
    }

    function _setExpirationPeriod(uint256 _secondsToExpire) public onlyRole(DEFAULT_ADMIN_ROLE)  {
        _expirationPeriod = _secondsToExpire;
    }

    function _getExpirationPeriod() internal view returns (uint256) {
        return _expirationPeriod;
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _burnIfExpired(to);
        _mint(to, amount);
        _balanceExpiration[to] = block.timestamp + _expirationPeriod;
    }
    
    function burn(address to, uint256 amount) public onlyRole(BURNER_ROLE) {
        _burn(to, amount);
    }

    function balanceOf(address account) public view override returns (uint256) {
        if (_balanceExpiration[account] > block.timestamp) {
            return super.balanceOf(account);
        } else {
            return 0;
        }
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        uint256 burnTransferAmount = amount / 10;
        require(
            balanceOf(from) >= amount + burnTransferAmount,
            "Not enough active balance including burning fee!"
        );
        require(
            _balanceExpiration[to] > 0,
            "Receiver wallet has never been activated!"
        );
        _burnIfExpired(to);
        super._transfer(from, to, amount);
        _burn(from, burnTransferAmount);
        _balanceExpiration[to] = block.timestamp + _expirationPeriod;
    }

    function expirationEpochTime(address account)
        public
        view
        returns (uint256)
    {
        return _balanceExpiration[account];
    }

    function secondsToExpire(address account) public view returns (uint256) {
        if (_balanceExpiration[account] > block.timestamp) {
            return _balanceExpiration[account] - block.timestamp;
        } else {
            return 0;
        }
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}
}
