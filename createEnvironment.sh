npm install --save-dev webpack webpack-cli webpack-dev-server @webpack-cli/generators html-webpack-plugin workbox-webpack-plugin
npm install --save-dev hardhat chai @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-network-helpers @nomiclabs/hardhat-etherscan
npm install --save-dev @openzeppelin/hardhat-upgrades
npm install dotenv @openzeppelin/contracts @openzeppelin/contracts-upgradeable
npx hardhat init
echo "\x1b[1;31m 🚨 Don't enable PWA 👀 \x1B[0m"
npx webpack init
touch .env
npx webpack serve
