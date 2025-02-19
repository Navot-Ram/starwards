import { GraphPointInput, PlotlyGraphBuilder } from './ploty-graph-builder';
import {
    MAX_SAFE_FLOAT,
    ShipManager,
    SmartPilotMode,
    SpaceManager,
    Spaceship,
    limitPercision,
    makeShipState,
    shipConfigurations,
    timeToReachDistanceByAccelerationWithMaxSpeed,
    timeToReachVelocityByAcceleration,
} from '../src';

import { ShipDie } from '../src/ship/ship-die';

export class MockDie {
    private _expectedRoll = 0;
    public getRoll(_: string, __?: number, ___?: number): number {
        return this._expectedRoll;
    }

    public getSuccess(_: string, successProbability: number): boolean {
        return this._expectedRoll < successProbability;
    }

    public getRollInRange(_: string, min: number, max: number): number {
        if (this._expectedRoll >= min && this._expectedRoll < max) {
            return this._expectedRoll;
        }
        return min;
    }

    set expectedRoll(roll: number) {
        this._expectedRoll = roll;
    }
}
abstract class AbsTestMetrics {
    constructor(public iterationsPerSecond: number, public distance: number) {}
    abstract readonly timeToReach: number;
    get iterations() {
        return Math.floor(this.timeToReach * this.iterationsPerSecond);
    }
    get iterationDistance() {
        return this.distance / this.iterations;
    }
    get percisionErrorsBoundery() {
        return this.iterations * Math.abs(limitPercision(this.iterationDistance) - this.iterationDistance);
    }
    get errorMargin() {
        return Math.max(1, limitPercision(2 * this.iterationDistance + this.percisionErrorsBoundery));
    }
    get sqrtErrorMargin() {
        return Math.max(1, limitPercision(Math.sqrt(this.iterationDistance) + this.percisionErrorsBoundery));
    }
}

const stabilizationFactor = 2;
export class MovementTestMetrics extends AbsTestMetrics {
    constructor(
        public iterationsPerSecond: number,
        public distance: number,
        public capacity: number,
        private maxSpeed: number = MAX_SAFE_FLOAT
    ) {
        super(iterationsPerSecond, distance);
    }
    get timeToReach() {
        const time = timeToReachDistanceByAccelerationWithMaxSpeed(this.distance, this.capacity, this.maxSpeed);
        return Math.max(1, time) * stabilizationFactor;
    }
}
export class SpeedTestMetrics extends AbsTestMetrics {
    constructor(public iterationsPerSecond: number, public speedDiff: number, public capacity: number) {
        super(iterationsPerSecond, speedDiff);
    }
    get timeToReach() {
        return Math.max(1, timeToReachVelocityByAcceleration(this.speedDiff, this.capacity)) * stabilizationFactor;
    }
}

export class TimedTestMetrics extends AbsTestMetrics {
    constructor(iterationsPerSecond: number, public timeToReach: number, distance: number) {
        super(iterationsPerSecond, distance);
    }
}

declare let global: typeof globalThis & {
    harness?: ShipTestHarness;
};

const dragonflyConfig = shipConfigurations['dragonfly-SF22'];

export class ShipTestHarness {
    public spaceMgr = new SpaceManager();
    public shipObj = new Spaceship();
    public shipMgr = new ShipManager(
        this.shipObj,
        makeShipState(this.shipObj.id, dragonflyConfig),
        this.spaceMgr,
        new ShipDie(3)
    );
    private graphBuilder: PlotlyGraphBuilder | null = null;

    constructor() {
        this.shipObj.id = '1';
        this.spaceMgr.insert(this.shipObj);
        global.harness = this;
        this.shipMgr.setSmartPilotManeuveringMode(SmartPilotMode.DIRECT);
        this.shipMgr.setSmartPilotRotationMode(SmartPilotMode.DIRECT);
    }

    get shipState() {
        return this.shipMgr.state;
    }

    graph() {
        if (!this.graphBuilder) {
            throw new Error('graph not initialized');
        }
        return this.graphBuilder.build();
    }

    initGraph(metrics: Record<string, () => number>) {
        this.graphBuilder = new PlotlyGraphBuilder(metrics);
    }

    simulate(timeInSeconds: number, iterations: number, body?: (time: number, log?: GraphPointInput) => unknown) {
        const iterationTimeInSeconds = limitPercision(timeInSeconds / iterations);
        this.shipMgr.update(iterationTimeInSeconds);
        this.spaceMgr.update(iterationTimeInSeconds);
        this.graphBuilder?.newPoint(0);
        for (let i = 0; i < iterations; i++) {
            const p = this.graphBuilder?.newPoint(iterationTimeInSeconds);
            this.shipState.reactor.afterBurnerFuel = this.shipState.reactor.maxAfterBurnerFuel;
            this.shipState.reactor.energy = this.shipState.reactor.maxEnergy;
            body && body(iterationTimeInSeconds, p);
            this.shipMgr.update(iterationTimeInSeconds);
            this.spaceMgr.update(iterationTimeInSeconds);
        }
        this.graphBuilder?.newPoint(iterationTimeInSeconds);
    }

    addToGraph(n: string, v: number) {
        this.graphBuilder?.newPoint(0).addtoLine(n, v);
    }

    annotateGraph(text: string) {
        this.graphBuilder?.newPoint(0).annotate(text);
    }
}
