/* eslint-disable no-console */
import { ShipManager, SpaceManager, jouster, Spaceship, Vec2 } from '@starwards/model';

const speedMax = 50;
const locationRange = 10 * 1000;

class Snapshot {
    public a = new Spaceship();
    public b = new Spaceship();
    constructor(a: Spaceship, b: Spaceship) {
        this.a.setValue(a);
        this.b.setValue(b);
    }
}

function makeShip(id: string) {
    const ship = new Spaceship();
    ship.id = id;
    ship.position = new Vec2((Math.random() - 0.5) * locationRange, (Math.random() - 0.5) * locationRange);
    ship.angle = Math.random() * 360;
    ship.turnSpeed = Math.random() * 360;
    ship.velocity = Vec2.Rotate({ x: Math.random() * speedMax, y: 0 }, Math.random() * 360);
    ship.health = 1000;
    return ship;
}

const iterationTimeInSeconds = 1 / 20;
function rankA(a: Spaceship, b: Spaceship) {
    const ships = new Map<string, ShipManager>();
    const spaceManager = new SpaceManager();
    let winner: 'A' | 'B' | null = null;
    const aManager = new ShipManager(a, spaceManager, ships, () => {
        winner = 'B';
    });
    const bManager = new ShipManager(b, spaceManager, ships, () => {
        winner = 'A';
    });
    ships.set(a.id, aManager);
    ships.set(b.id, bManager);
    spaceManager.insert(a);
    spaceManager.insert(b);
    spaceManager.forceFlushEntities();
    aManager.setTarget('B');
    bManager.setTarget('A');
    aManager.bot = jouster();
    bManager.bot = jouster();
    // loop till death
    while (!winner) {
        spaceManager.update(iterationTimeInSeconds);
        aManager.update(iterationTimeInSeconds);
        bManager.update(iterationTimeInSeconds);
    }
    if (winner === 'A') {
        return a.health;
    } else {
        return -b.health;
    }
}
console.time('rankA');
for (let i = 0; i < 100; i++) {
    const a = makeShip('A');
    const b = makeShip('B');
    const ss = new Snapshot(a, b);
    console.log('result:', rankA(a, b));
}
console.timeEnd('rankA');
// https://medium.com/@quasimik/implementing-monte-carlo-tree-search-in-node-js-5f07595104df
// https://www.youtube.com/watch?v=TsYk5fV25Og
