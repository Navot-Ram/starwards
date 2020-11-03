import { jouster, jousterFlanker } from '@starwards/model/src';
import { expect } from 'chai';
import 'mocha';
import { makeShip, rankA } from '../src';

describe('simulation', () => {
    it('two bots of the same type are equal ', () => {
        const ITERATIONS = 1000;
        const CONF = {
            speedMax: 50,
            locationRange: 10 * 1000,
            health: 1000,
        };
        let total = 0;
        for (let i = 0; i < ITERATIONS; i++) {
            total += rankA(makeShip('A', CONF), makeShip('B', CONF), jouster(), jouster(), 1000);
        }
        const avg = total / 100;
        expect(avg).to.be.closeTo(0, CONF.health / 5);
    });
    it.skip('jousterFlanker is better than jouster', () => {
        const ITERATIONS = 1000;
        const CONF = {
            speedMax: 50,
            locationRange: 10 * 1000,
            health: 1000,
        };
        let total = 0;
        for (let i = 0; i < ITERATIONS; i++) {
            total += rankA(makeShip('A', CONF), makeShip('B', CONF), jousterFlanker(), jouster(), 1000);
        }
        const avg = total / 100;
        expect(avg).to.be.gte(CONF.health / 5);
    });
});
