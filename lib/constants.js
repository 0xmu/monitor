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
	"function settlePositions(uint256[] calldata positionIds)",
	"function canSettlePositions(uint256[] calldata positionIds) view returns(uint256[] memory _positionIds)",
	"function liquidatePositions(uint256[] calldata positionIds)",
	"function getPositions(uint256[] calldata positionIds) view returns(tuple(uint64 productId, uint64 leverage, uint64 price, uint64 margin, address owner, uint80 timestamp, bool isLong, bool isSettling)[] _positions)",
	"function getProduct(uint256 productId) view returns(tuple(address feed, uint72 maxLeverage, uint16 fee, bool isActive, uint64 maxExposure, uint48 openInterestLong, uint48 openInterestShort, uint16 interest, uint32 settlementTime, uint16 minTradeDuration, uint16 liquidationThreshold, uint16 liquidationBounty))",
	"function getLatestPrice(address feed, uint256 productId) view returns(uint256)",
	
	"event NewPosition(uint256 indexed positionId, address indexed user, uint256 indexed productId, bool isLong, uint256 price, uint256 margin, uint256 leverage)",
	"event AddMargin(uint256 indexed positionId, address indexed user, uint256 margin, uint256 newMargin, uint256 newLeverage)",
	"event ClosePosition(uint256 positionId, address indexed user, uint256 indexed productId, bool indexed isFullClose, uint256 price, uint256 entryPrice, uint256 margin, uint256 leverage, uint256 pnl, bool pnlIsNegative, bool wasLiquidated)",
	"event NewPositionSettled(uint256 indexed positionId, address indexed user, uint256 price)"
];

export const NETWORK = `https://arbitrum-mainnet.infura.io/v3/9cd1a8177bdb46a7b894327f8df6e173`;