const settle = require('./settler.js');
const liquidate = require('./liquidator.js');

//settle({query: {isLocal: true, chain: 'rinkeby'}});
liquidate({query: {isLocal: true, chain: 'localhost'}});