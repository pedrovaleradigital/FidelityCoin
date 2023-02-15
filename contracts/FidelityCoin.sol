// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract FidelityCoin is ERC20, ERC20Burnable, AccessControl  {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 private _expirationPeriod = 60; //Starts With 60 seconds for expiration

    mapping (address => uint256) internal _balanceExpiration;

    constructor() ERC20("Fidelicoin", "FIDO") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function setExpirationPeriod(uint256 _secondsToExpire) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _expirationPeriod = _secondsToExpire;
    }

    function getExpirationPeriod() public view returns(uint256) {
        return _expirationPeriod;
    }

    function _burnIfExpired(address account) internal {
        if (block.timestamp >= _balanceExpiration[account]){
            _burn(account, super.balanceOf(account));
        }
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _burnIfExpired(to);
        _mint(to, amount);
        _balanceExpiration[to] = block.timestamp + _expirationPeriod;
    }

    function _transfer(address from, address to, uint256 amount) internal override {
        uint256 burnTransferAmount = amount / 10;
        require (balanceOf(from) >= amount + burnTransferAmount, "Not enough active balance including burning fee!");
        require (_balanceExpiration[to]>0, "Receiver wallet has never been activated!");
        _burnIfExpired(to);
        super._transfer(from, to, amount);
        _burn(from,burnTransferAmount);
        _balanceExpiration[to] = block.timestamp + _expirationPeriod;
    }

    function balanceOf(address account) public view override returns (uint256) {
        if (_balanceExpiration[account]>block.timestamp) {
            return super.balanceOf(account);
        }
        else {
            return 0;
        }
    }

    function expirationEpochTime(address account) public view returns(uint256) {
        return _balanceExpiration[account];
    }

    function secondsToExpire(address account) public view returns(uint256){
        if (_balanceExpiration[account]>block.timestamp) {
            return _balanceExpiration[account]-block.timestamp;
        }
        else {
            return 0;
        }
    }
}
