// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface IFidelityCoin {
    function mint(address to, uint256 amount) external;

    function balanceOf(address account) external view returns (uint256);
}

contract AirdropFidelityCoin is
    Initializable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IFidelityCoin FidelityCoin;
    address public FidelityCoinAdd;
    uint factor = 7;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function participateInAirdropFC(address participantadd, uint256 pricevalue) public whenNotPaused {
        uint256 receivedtokens = pricevalue / factor;
        FidelityCoin.mint(participantadd,receivedtokens);
    }

    function setFidelityCoinAdd(address _TokenAdd) external onlyRole(DEFAULT_ADMIN_ROLE){
        FidelityCoin = IFidelityCoin(_TokenAdd);
        FidelityCoinAdd = _TokenAdd;
    }

    function getFidelityCoinAdd() public view returns (address){
        return FidelityCoinAdd;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
 

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}