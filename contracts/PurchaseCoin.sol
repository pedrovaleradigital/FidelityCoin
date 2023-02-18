// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "hardhat/console.sol";
interface IFidelityCoin {
    
    function approve(address spender, uint256 amount) external returns (bool);
    
    function transferFrom(address _sender, address _recipient, uint256 _amount) external;

    function balanceOf(address account) external returns (uint256);
    
    function allowance(address _owner, address _spender) external view returns (uint256);

    function mint(address to, uint256 amount) external;

    function burn(address to, uint256 amount) external;
}

interface IFidelityNFT {
    
    function safeMint(address to, uint256 id) external;
    
    function getNftPriceById(uint256 nftId) external returns (uint256);
}

contract PurchaseCoin is Initializable, PausableUpgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    uint256 constant FIDO_MIN_BUY = 500;
    uint256 constant FIDO_VALUE_ETHER = 8.61 * 10**18 / FIDO_MIN_BUY;
    

    // instanciamos el token en el contrato
    IFidelityCoin fidelityCoin;
    IFidelityNFT fidelityNFT;
    address gnosisSafeWallet;

    function setGnosisWallet(address _gnosisSafeWallet) external {
        gnosisSafeWallet = _gnosisSafeWallet;
    }
    function setFidelityCoin(address _address)  external {
        fidelityCoin = IFidelityCoin(_address);
    }

    function setFidelityNFT(address _address)  external {
        fidelityNFT = IFidelityNFT(_address);
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() initializer public {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}

    event DeliverNft(address winnerAccount, uint256 nftId);
    /**********************/

    function purchaseFidoUsingSoles(uint256 _amountSoles) external {
        
        require(_amountSoles > 0, "PurchaseCoin: Not enough amount in Soles");

        // tiene que haber participado
        uint256 _balance = fidelityCoin.balanceOf(msg.sender);
        require(_balance > 0,"PurchaseCoin: Not enough token balance");
        
        // S/ 0.10 POR FIDO
        uint256 numFidos = 10 * _amountSoles;
        require(numFidos >= FIDO_MIN_BUY, "PurchaseCoin: Not enough FIDOS to buy");

        //console.log("Mint %s fidos",numFidos);

        //500 FIDO = 0.007814 ETH
        uint256 ethers = numFidos * FIDO_VALUE_ETHER ;
        //console.log("Transferring from to %s %s ethers", gnosisSafeWallet, ethers);

        //fidelityCoin.approve(address(this), ethers);
        //fidelityCoin.transferFrom(msg.sender,gnosisSafeWallet, ethers);

        (bool success, ) = payable(address(this)).call{
            value: 0.001 ether,
            gas: 50000
        }("");
        require(success, "PurchaseCoin: Failed to send Ether");

        fidelityCoin.mint(msg.sender, numFidos * 10 **18);
    }

    event EtherReceived(uint256 amount, uint256 gasLeft);
    receive() external payable {
        emit EtherReceived(msg.value, gasleft());
        depositEthForFido();
    }

    function depositEthForFido() public payable {
        
        require(msg.value >= FIDO_VALUE_ETHER * FIDO_MIN_BUY, "PurchaseCoin: Not enoght amount of Ether");

        uint256 numFidos = msg.value /FIDO_VALUE_ETHER;
        uint256 ethers = numFidos * FIDO_VALUE_ETHER ;

        if (msg.value > ethers) {
            // logica para dar cambio
            // usar '.transfer' para enviar ether de vuelta al usuario
            uint256 _diffEther = msg.value - ethers;
            //console.log("FIDOS %s Enviado %s ,vuelto %s",numFidos, msg.value, _diffEther);
            payable(msg.sender).transfer(_diffEther);
        }

        //enviamos los ethers al gnosis
        //console.log("ethers %s",ethers);
        (bool success, ) = payable(gnosisSafeWallet).call{
            value: ethers,
            gas: 50000
        }("");
        require(success, "PurchaseCoin: Failed to send Ether");        

        fidelityCoin.mint(msg.sender, numFidos * 10 **18);
    }

    /*
    NFT BUT
    */

    struct NFT {
        uint256 price;  //PRECIO VENDIDO
        address address_owner;
        bool isSold; //INDICA SI ESTA VENDIDO
    }
    uint256 totalOfNFT;

    mapping(uint256 => NFT) public nftsById;
    
    function purchaseNftById(uint256 _id) external {

        require((_id > 0 && _id <= 52), "PurchaseNFT: Token id out of range");

        require(!nftsById[_id].isSold, "PurchaseNFT: id not available");

        uint256 priceNFT = fidelityNFT.getNftPriceById(_id) * 10 ** 18;
        

        uint256 _balance = fidelityCoin.balanceOf(msg.sender);
        //console.log("balance %s",_balance);
        require(_balance >= priceNFT,"PurchaseNFT: Not enough token balance");

        //bool success = fidelityCoin.approve(address(this),priceNFT);
        //require(success, "PurchaseNFT: Failed to approve FidelityCoin");  

        //uint256 _allowance = fidelityCoin.allowance(msg.sender, address(this));
        //console.log("allowance %s",_allowance);

        nftsById[_id] = NFT({
                price : priceNFT,  //PRECIO VENDIDO
                address_owner : msg.sender,
                isSold : true
        });
        totalOfNFT++;
        
        fidelityCoin.burn(msg.sender,priceNFT);

        fidelityNFT.safeMint(msg.sender,_id);

        emit DeliverNft(msg.sender, _id);
    }

    function getNftDetailById(uint256 _id) external view returns (NFT memory){        
        return nftsById[_id];        
     }
}
