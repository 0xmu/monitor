const settle = require('./settler.js');
const liquidate = require('./liquidator.js');
const volume = require('./volume.js');
const stats = require('./stats.js');

//settle({query: {isLocal: true, chain: 'localhost'}});
//liquidate({query: {isLocal: true, chain: 'localhost'}});
//settle({query: {isLocal: true, chain: 'arbitrum'}});
//liquidate({query: {isLocal: true, chain: 'arbitrum'}});
//volume({query: {isLocal: true, chain: 'arbitrum'}});

stats({query: {isLocal: true, chain: 'arbitrum'}});
