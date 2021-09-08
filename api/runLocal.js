const settle = require('./settler.js');
const liquidate = require('./liquidator.js');

//settle({query: {isLocal: true, chain: 'localhost'}});
//liquidate({query: {isLocal: true, chain: 'localhost'}});
//settle({query: {isLocal: true, chain: 'arbitrum'}});
liquidate({query: {isLocal: true, chain: 'arbitrum'}});