const INFURA_KEY = '5eff325e2ff0494c9996c8c0273058e7';

exports.SETTLER_ABI = [
	"function settlePositions(uint256[] calldata)",
	"function canSettlePositions(uint256[] calldata) view returns(uint256[] memory _positionIds)",
	"event NewPosition(uint256 positionId, address indexed user, uint64 indexed productId, bool isLong, uint256 price, uint256 margin, uint256 leverage)",
	"event NewPositionSettled(uint256 positionId, address indexed user, uint256 price)"
];

exports.DATA = {
	localhost: {
		network: 'http://localhost:8545'
	},
	rinkeby: {
		network: `https://rinkeby.infura.io/v3/${INFURA_KEY}`
	},
	arbitrum: {
		network: `https://arb1.arbitrum.io/rpc`
	}
};