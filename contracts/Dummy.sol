// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol"; //For MPRTKN Token
import "@openzeppelin/contracts/utils/math/Math.sol";//Math helper

contract Dummy is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    function version() external pure returns(string memory){
        return "1.0";
    }

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    bool[30] _isSoldToken; //0..29
    uint256 _soldTokens;

    // Mi Primer Token
    // Crear su setter
    IERC20Upgradeable miPrimerToken;
    address mprtknAddress;

    // 21 de diciembre del 2022 GMT
    uint256 constant startDate = 1671580800;

    // Maximo price NFT
    uint256 constant MAX_PRICE_NFT = 50000; // Se elimina * 10 ** 18, es en unidades, cálculo de precio añade decimales

    // Gnosis Safe
    // Crear su setter
    address gnosisSafeWallet;

    event ReceivedEth(uint256 ethamount);
    event DeliverNft(address winnerAccount, uint256 nftId);
    event getExchangeRate(uint256 exchangedUSDC, uint256 exchangedMPRTKN);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() payable {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    function setMPRTKN(address _mprtknAddress) public {
        mprtknAddress = _mprtknAddress;
        miPrimerToken = IERC20Upgradeable(mprtknAddress);
    }

    function getMPRTKN() public view returns (address) {
        return mprtknAddress;
    }

    function setGnosisWalletAddress(address _gnosisSafeWallet) public {
        gnosisSafeWallet = _gnosisSafeWallet;
    }

    function getGnosisWalletAddress() public view returns (address) {
        return gnosisSafeWallet;
    }

    function soldTokens() public view returns (uint256) {
        return _soldTokens;
    }

    function purchaseNftById(uint256 _id) external {
        // 4 - el _id se encuentre entre 1 y 30
        //         * Mensaje de error: "NFT: Token id out of range"
        require((_id > 0) && (_id < 31), "NFT: Token id out of range");

        // Realizar 3 validaciones:
        // 1 - el id no se haya vendido. Sugerencia: llevar la cuenta de ids vendidos
        //         * Mensaje de error: "Public Sale: id not available"
        require(!_isSoldToken[_id - 1], "Public Sale: id not available");

        // Obtener el precio segun el id
        uint256 priceNft = _getPriceById(_id);

        // 2 - el msg.sender haya dado allowance a este contrato en suficiente de MPRTKN
        //         * Mensaje de error: "Public Sale: Not enough allowance"
        require(
            miPrimerToken.allowance(msg.sender, address(this)) >= priceNft,
            "Public Sale: Not enough allowance"
        );

        // 3 - el msg.sender tenga el balance suficiente de MPRTKN
        //         * Mensaje de error: "Public Sale: Not enough token balance"
        require(
            miPrimerToken.balanceOf(msg.sender) >= priceNft,
            "Public Sale: Not enough token balance"
        );

        // Purchase fees
        // 10% para Gnosis Safe (fee)
        // 90% se quedan en este contrato (net)
        // from: msg.sender - to: gnosisSafeWallet - amount: fee
        // from: msg.sender - to: address(this) - amount: net

        uint256 fee = (priceNft * 10) / 100;
        uint256 net = priceNft - fee;

        // enviar comision a Gnosis Safe
        miPrimerToken.transferFrom(msg.sender, gnosisSafeWallet, fee);

        // cobrar MiPrimerToken al comprador
        miPrimerToken.transferFrom(msg.sender, address(this), net);

        _isSoldToken[_id - 1] = true;
        _soldTokens++;

        // EMITIR EVENTO para que lo escuche OPEN ZEPPELIN DEFENDER
        emit DeliverNft(msg.sender, _id);//1..30
    }

    function depositEthForARandomNft() public payable {
        // Realizar 2 validaciones
        // 1 - que el msg.value sea mayor o igual a 0.01 ether
        require(
            msg.value >= 0.01 ether,
            "Ether Insuficiente. Debe ser al menos 0.01"
        );
        // 2 - que haya NFTs disponibles para hacer el random
        require(_soldTokens < 30, "No quedan Tokens NFT disponibles");
        // Escgoer una id random de la lista de ids disponibles
        uint256 nftId = _getRandomNftId(); // 1..30
        uint256 iterations = 0; //0..29
        while (_isSoldToken[nftId - 1] && iterations < 29) {
            nftId = (nftId % 30) + 1;
            iterations++;
        }
        // Enviar ether a Gnosis Safe
        // SUGERENCIA: Usar gnosisSafeWallet.call para enviar el ether
        // Validar los valores de retorno de 'call' para saber si se envio el ether correctamente
        (bool ethInGnosis, ) = payable(gnosisSafeWallet).call{
            value: 0.01 ether,
            gas: 300000
        }("");
        require(ethInGnosis, "No se ha completado transferencia a Safe Wallet");
        // Dar el cambio al usuario
        // El vuelto seria equivalente a: msg.value - 0.01 ether
        if (msg.value > 0.01 ether) {
            // logica para dar cambio
            // usar '.transfer' para enviar ether de vuelta al usuario
            payable(msg.sender).transfer(msg.value - 0.01 ether);
        }
        _isSoldToken[nftId - 1] = true;
        _soldTokens++;
        // EMITIR EVENTO para que lo escuche OPEN ZEPPELIN DEFENDER
        emit DeliverNft(msg.sender, nftId);//1..30
    }

    // PENDING
    // Crear el metodo receive
    receive() external payable {
        emit ReceivedEth(msg.value);
        depositEthForARandomNft();
    }

    function getPriceById(uint256 _id) public view returns (uint256) {
        require(_id > 0 && _id < 31, "Token ID fuera de rango");
        return _getPriceById(_id);
    }

    ////////////////////////////////////////////////////////////////////////
    /////////                    Helper Methods                    /////////
    ////////////////////////////////////////////////////////////////////////

    // Devuelve un id random de NFT de una lista de ids disponibles
    function _getRandomNftId() internal view returns (uint256) {
        uint256 randomTokenId = (uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender))
        ) % 30); //0..29
        return randomTokenId + 1;//1..30
    }

    // Según el id del NFT, devuelve el precio. Existen 3 grupos de precios
    function _getPriceById(uint256 _id) internal view returns (uint256) {
        uint256 nftPrice;
        if (_id > 0 && _id < 11) {
            nftPrice = 500;
        } else if (_id > 10 && _id < 21) {
            nftPrice = (_id * 1000);
        } else {
            nftPrice = Math.min(
                MAX_PRICE_NFT,
                10000 + (1000 * (block.timestamp - startDate)) / 3600
            );
        }
        return nftPrice * 10**18; //Se añaden decimales
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {
        //
    }
}
