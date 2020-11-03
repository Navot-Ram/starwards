import { jouster } from '@starwards/model/src';
/* eslint-disable no-console */
import { makeShip, rankA } from '.';

const CONF = {
    speedMax: 50,
    locationRange: 10 * 1000,
    health: 1000,
};

console.time('rankA');
for (let i = 0; i < 100; i++) {
    const a = makeShip('A', CONF);
    const b = makeShip('B', CONF);
    // const ss = new Snapshot(a, b);
    console.log('result:', rankA(a, b, jouster(), jouster(), 10 * 1000));
}
console.timeEnd('rankA');
// https://medium.com/@quasimik/implementing-monte-carlo-tree-search-in-node-js-5f07595104df
// https://www.youtube.com/watch?v=TsYk5fV25Og
