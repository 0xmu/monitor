const INFURA_KEY = '8cccc478d2e54cb3bc3ec5524793f636';

exports.SETTLER_ABI = [
	"function checkPositionsToSettle() view returns(uint256[] memory)",
	"function settlePositions(uint256[] calldata)"
];

exports.DATA = {
	rinkeby: {
		network: `https://rinkeby.infura.io/v3/${INFURA_KEY}`
	}
};