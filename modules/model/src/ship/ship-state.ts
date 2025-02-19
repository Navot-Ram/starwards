import { ArraySchema, type } from '@colyseus/schema';

import { Armor } from './armor';
import { ChainGun } from './chain-gun';
import { ModelParams } from '../model-params';
import { Radar } from './radar';
import { Reactor } from './reactor';
import { ShipDirection } from './ship-direction';
import { ShipPropertiesModel } from './ship-configuration';
import { SmartPilot } from './smart-pilot';
import { Spaceship } from '../space';
import { Thruster } from './thruster';
import { toDegreesDelta } from '..';

export enum TargetedStatus {
    NONE,
    LOCKED,
    FIRED_UPON,
}

export class ShipState extends Spaceship {
    @type(ModelParams)
    modelParams!: ModelParams<keyof ShipPropertiesModel>;

    @type([Thruster])
    thrusters!: ArraySchema<Thruster>;

    @type(ChainGun)
    chainGun!: ChainGun;

    @type(Radar)
    radar!: Radar;

    @type(Reactor)
    reactor!: Reactor;

    @type(SmartPilot)
    smartPilot!: SmartPilot;

    @type('float32')
    rotation = 0;
    @type('float32')
    boost = 0;
    @type('float32')
    strafe = 0;

    @type('float32')
    antiDrift = 0;
    @type('float32')
    breaks = 0;
    @type('float32')
    afterBurner = 0;

    @type('int8')
    targeted = TargetedStatus.NONE;

    @type(Armor)
    armor!: Armor;

    @type('int32')
    chainGunAmmo = 0;

    // server only, used for commands
    public afterBurnerCommand = 0;
    public nextTargetCommand = false;
    public clearTargetCommand = false;
    public rotationModeCommand = false;
    public maneuveringModeCommand = false;

    // TODO: move to logic (not part of state)
    get rotationCapacity(): number {
        return this.modelParams.get('rotationCapacity');
    }
    get rotationEnergyCost(): number {
        return this.modelParams.get('rotationEnergyCost');
    }
    get maxChainGunAmmo(): number {
        return this.modelParams.get('maxChainGunAmmo');
    }

    *angleThrusters(direction: ShipDirection) {
        for (const thruster of this.thrusters) {
            if (toDegreesDelta(direction) === toDegreesDelta(thruster.angle)) {
                yield thruster;
            }
        }
    }

    velocityCapacity(direction: ShipDirection) {
        return [...this.angleThrusters(direction)].reduce((s, t) => s + t.getVelocityCapacity(this), 0);
    }

    getMaxSpeedForAfterburner(afterBurner: number) {
        return this.smartPilot.maxSpeed + afterBurner * this.smartPilot.maxSpeedFromAfterBurner;
    }

    get maxSpeed() {
        return this.getMaxSpeedForAfterburner(this.afterBurner);
    }
    get maxMaxSpeed() {
        return this.getMaxSpeedForAfterburner(1);
    }
}
