import settle from './settler.js'
import liquidate from './liquidator.js'
import stats from './stats.js'

var args = process.argv.slice(2);
console.log('args: ', args);

if (args[0] == 'liquidate') {
	liquidate();
} else if (args[0] == 'settle') {
	settle();
} else if (args[0] == 'stats') {
	stats();
}