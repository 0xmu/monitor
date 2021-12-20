export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

export const PRODUCTS = {
	1: 'ETH-USD',
	2: 'BTC-USD',
	3: 'LINK-USD',
	16: 'AAVE-USD',
	17: 'SUSHI-USD',
	18: 'UNI-USD',
	19: 'YFI-USD'
};

export const ABI = [
	"function getProduct(bytes32 productId) view returns(tuple(uint64 maxLeverage, uint64 liquidationThreshold, uint64 fee, uint64 interest))",

	"function getOrders(bytes32[] keys) view returns(tuple(bool isClose, uint64 size, uint64 margin)[])",
		"function getPositions(bytes32[] keys) view returns(tuple(uint64 size, uint64 margin, uint64 timestamp, uint64 price)[])",

	"event NewOrder(bytes32 indexed key,address indexed user,bytes32 indexed productId,address currency,bool isLong,uint256 margin,uint256 size,bool isClose)",
	"event PositionUpdated(bytes32 indexed key,address indexed user,bytes32 indexed productId,address currency,bool isLong,uint256 margin,uint256 size,uint256 price,uint256 fee)",
	"event ClosePosition(bytes32 indexed key,address indexed user,bytes32 indexed productId,address currency,bool isLong,uint256 price,uint256 margin,uint256 size,uint256 fee,int256 pnl,bool wasLiquidated)"
];

export const ABI_TREASURY = [
];

export const NETWORK = `https://arb1.arbitrum.io/rpc`;