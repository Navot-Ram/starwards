import { Schema, type } from '@colyseus/schema';

import { ModelParams } from '../model-params';
import { SmartPilotModel } from './ship-configuration';
import { Vec2 } from '../space';

export enum SmartPilotMode {
    DIRECT,
    VELOCITY,
    TARGET,
}

export class SmartPilot extends Schema {
    public static isInstance = (o: unknown): o is SmartPilot => {
        return (o as SmartPilot)?.type === 'SmartPilot';
    };

    public readonly type = 'SmartPilot';

    @type(ModelParams)
    modelParams!: ModelParams<keyof SmartPilotModel>;

    @type('int8')
    rotationMode!: SmartPilotMode;
    @type('int8')
    maneuveringMode!: SmartPilotMode;
    @type('float32')
    rotation = 0;
    @type('float32')
    rotationTargetOffset = 0;
    @type(Vec2)
    maneuvering: Vec2 = new Vec2(0, 0);

    /**
     * factor of error vector when active - (0-1)
     */
    @type('float32')
    offsetFactor = 0;

    get maxTargetAimOffset(): number {
        return this.modelParams.get('maxTargetAimOffset');
    }

    get aimOffsetSpeed(): number {
        return this.modelParams.get('aimOffsetSpeed');
    }

    get maxTurnSpeed(): number {
        return this.modelParams.get('maxTurnSpeed');
    }

    get offsetBrokenThreshold(): number {
        return this.modelParams.get('offsetBrokenThreshold');
    }

    /**
     * damage ammount / DPS at which there's 50% chance of system damage
     **/
    get damage50(): number {
        return this.modelParams.get('damage50');
    }
    get broken(): boolean {
        return this.offsetFactor >= this.offsetBrokenThreshold;
    }
    get maxSpeed() {
        return this.modelParams.get('maxSpeed');
    }
    get maxSpeedFromAfterBurner() {
        return this.modelParams.get('maxSpeedFromAfterBurner');
    }
}
