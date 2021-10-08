import stats from './stats.js'

var args = process.argv.slice(2);
console.log('args: ', args);

if (args[0] == 'stats') {
	stats();
}