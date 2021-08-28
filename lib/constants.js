const INFURA_KEY = '8cccc478d2e54cb3bc3ec5524793f636';

exports.SETTLER_ABI = [
	"function checkPositionsToSettle() view returns(uint256[] memory)",
	"function settlePositions(uint256[] calldata)"
];

exports.DATA = {
	rinkeby: {
		network: `https://rinkeby.infura.io/v3/${INFURA_KEY}`,
		trading: '0x60A23705Ae6526CF62e8D114E340C28F7C45Cf76'
	}
};