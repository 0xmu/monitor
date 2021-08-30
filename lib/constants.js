const INFURA_KEY = '5eff325e2ff0494c9996c8c0273058e7';

exports.SETTLER_ABI = [
	"function checkPositionsToSettle() view returns(uint256[] memory)",
	"function settlePositions(uint256[] calldata)"
];

exports.DATA = {
	rinkeby: {
		network: `https://rinkeby.infura.io/v3/${INFURA_KEY}`
	}
};