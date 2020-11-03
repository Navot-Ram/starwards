import { Bot, ShipManager, SpaceManager, Spaceship, Vec2 } from '@starwards/model';
export class Snapshot {
    public a = new Spaceship();
    public b = new Spaceship();
    constructor(a: Spaceship, b: Spaceship) {
        this.a.setValue(a);
        this.b.setValue(b);
    }
}

export function rankA(
    a: Spaceship,
    b: Spaceship,
    aBot: Bot,
    bBot: Bot,
    timeout: number,
    iterationTimeInSeconds = 1 / 20
) {
    const timeoutTime = Date.now() + timeout;
    const ships = new Map<string, ShipManager>();
    const spaceManager = new SpaceManager();
    let winner: Spaceship | null = null;
    const aManager = new ShipManager(a, spaceManager, ships, () => {
        winner = b;
    });
    const bManager = new ShipManager(b, spaceManager, ships, () => {
        winner = a;
    });
    ships.set(a.id, aManager);
    ships.set(b.id, bManager);
    spaceManager.insert(a);
    spaceManager.insert(b);
    spaceManager.forceFlushEntities();
    aManager.setTarget('B');
    bManager.setTarget('A');
    aManager.bot = aBot;
    bManager.bot = bBot;
    // loop till death
    while (!winner && timeoutTime > Date.now()) {
        spaceManager.update(iterationTimeInSeconds);
        aManager.update(iterationTimeInSeconds);
        bManager.update(iterationTimeInSeconds);
    }
    return a.health - b.health;
}

export type ShipConfig = {
    speedMax: number;
    locationRange: number;
    health: number;
};
export function makeShip(id: string, config: ShipConfig) {
    const ship = new Spaceship();
    ship.id = id;
    ship.position = new Vec2(
        (Math.random() - 0.5) * config.locationRange,
        (Math.random() - 0.5) * config.locationRange
    );
    ship.angle = Math.random() * 360;
    ship.turnSpeed = Math.random() * 360;
    ship.velocity = Vec2.Rotate({ x: Math.random() * config.speedMax, y: 0 }, Math.random() * 360);
    ship.health = 1000;
    return ship;
}
