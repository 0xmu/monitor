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
	"function getChainlinkPrice(uint256 productId) view returns(uint256)",
	"function getProduct(uint256 productId) view returns(tuple(address feed, uint56 maxLeverage, uint16 fee, uint16 interest, bool isActive, uint64 maxExposure, uint64 openInterestLong, uint64 openInterestShort, uint32 oracleMaxDeviation, uint32 minTradeDuration))",
	"function getPositions(uint256[] calldata positionIds) view returns(tuple(uint40 closeOrderId, uint24 productId, uint64 leverage, uint64 price, uint64 margin, address owner, uint88 timestamp, bool isLong)[] _positions)",
	
	"event OpenOrder(uint256 indexed positionId, address indexed user, uint256 indexed productId)",
	"event NewPosition(uint256 indexed positionId, address indexed user, uint256 indexed productId, bool isLong, uint256 price, uint256 margin, uint256 leverage)",
	"event AddMargin(uint256 indexed positionId, address indexed user, uint256 margin, uint256 newMargin, uint256 newLeverage)",
	"event ClosePosition(uint256 positionId, address indexed user, uint256 indexed productId, bool indexed isFullClose, bool isLong, uint256 price, uint256 entryPrice, uint256 margin, uint256 leverage, uint256 pnl, bool pnlIsNegative, bool wasLiquidated)"
];

export const ABI_TREASURY = [
	"function vaultBalance() view returns(uint256)",
	"function vaultThreshold() view returns(uint256)",
];

export const NETWORK = `https://arbitrum-mainnet.infura.io/v3/9cd1a8177bdb46a7b894327f8df6e173`;