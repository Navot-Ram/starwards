import {
    calcShellSecondsToLive,
    getKillZoneRadiusRange,
    getShellAimVelocityCompensation,
    getTarget,
    isInRange,
    isTargetInKillZone,
    matchGlobalSpeed,
    moveToTarget,
    predictHitLocation,
    rotateToTarget,
    ShipManager,
    SpaceState,
    XY,
} from '@starwards/model';
import { ShipState } from '../ship';
import { SpaceObject } from '../space';

export type Bot = (deltaSeconds: number, spaceState: SpaceState, shipManager: ShipManager) => void;

function calcHelperValues(target: SpaceObject, lastTargetVelocity: XY, deltaSeconds: number, ship: ShipState) {
    const targetAccel = XY.scale(XY.difference(target.velocity, lastTargetVelocity), 1 / deltaSeconds);
    const hitLocation = predictHitLocation(ship, target, targetAccel);
    const distanceToTarget = XY.lengthOf(XY.difference(hitLocation, ship.position));
    const killRadius = getKillZoneRadiusRange(ship);
    return { hitLocation, killRadius, distanceToTarget };
}

export function jousterFlanker(): Bot {
    return bot((deltaSeconds: number, shipManager: ShipManager, target: SpaceObject, lastTargetVelocity: XY) => {
        const ship = shipManager.state;
        const { hitLocation, killRadius, distanceToTarget } = calcHelperValues(
            target,
            lastTargetVelocity,
            deltaSeconds,
            ship
        );
        const rotation = rotateToTarget(
            deltaSeconds,
            ship,
            XY.add(hitLocation, getShellAimVelocityCompensation(ship)),
            0
        );
        shipManager.setRotation(rotation);
        shipManager.setShellSecondsToLive(calcShellSecondsToLive(ship, hitLocation));

        const flankVector = XY.byLengthAndDirection((killRadius[0] + killRadius[1]) / 2, target.angle + 90);
        const hitLocation1 = XY.add(hitLocation, flankVector);
        const hitLocation2 = XY.difference(hitLocation, flankVector);
        const flankPosition =
            XY.lengthOf(XY.difference(ship.position, hitLocation1)) >
            XY.lengthOf(XY.difference(ship.position, hitLocation2))
                ? hitLocation1
                : hitLocation2;
        const flank = moveToTarget(deltaSeconds, ship, flankPosition);
        // close distance to target
        if (distanceToTarget > killRadius[1]) {
            // if close enough to target, tail it
            const matchSpeed = matchGlobalSpeed(deltaSeconds, ship, target.velocity);
            shipManager.setBoost((matchSpeed.boost + flank.boost) / 2);
            shipManager.setStrafe((matchSpeed.strafe + flank.strafe) / 2);
        } else {
            // distanceToTarget < killRadius[0]
            shipManager.setBoost(-flank.boost);
            shipManager.setStrafe(-flank.strafe);
        }
    });
}

export function jouster(): Bot {
    return bot((deltaSeconds: number, shipManager: ShipManager, target: SpaceObject, lastTargetVelocity: XY) => {
        const ship = shipManager.state;
        const { hitLocation, killRadius, distanceToTarget } = calcHelperValues(
            target,
            lastTargetVelocity,
            deltaSeconds,
            ship
        );
        const rotation = rotateToTarget(
            deltaSeconds,
            ship,
            XY.add(hitLocation, getShellAimVelocityCompensation(ship)),
            0
        );
        shipManager.setRotation(rotation);
        shipManager.setShellSecondsToLive(calcShellSecondsToLive(ship, hitLocation));
        if (isInRange(killRadius[0], killRadius[1], distanceToTarget)) {
            // if close enough to target, tail it
            const maneuvering = matchGlobalSpeed(deltaSeconds, ship, target.velocity);
            shipManager.setBoost(maneuvering.boost);
            shipManager.setStrafe(maneuvering.strafe);
        } else {
            const maneuvering = moveToTarget(deltaSeconds, ship, hitLocation);
            // close distance to target
            if (distanceToTarget > killRadius[1]) {
                shipManager.setBoost(maneuvering.boost);
                shipManager.setStrafe(maneuvering.strafe);
            } else {
                // distanceToTarget < killRadius[0]
                shipManager.setBoost(-maneuvering.boost);
                shipManager.setStrafe(-maneuvering.strafe);
            }
        }
    });
}

type AttackStrategy = (
    deltaSeconds: number,
    shipManager: ShipManager,
    target: SpaceObject,
    lastTargetVelocity: XY
) => void;

function bot(strategy: AttackStrategy): Bot {
    let lastTargetVelocity = XY.zero;
    let deltaSeconds = 1 / 20;
    return (currDeltaSeconds: number, spaceState: SpaceState, shipManager: ShipManager) => {
        deltaSeconds = deltaSeconds * 0.8 + currDeltaSeconds * 0.2;
        const target = getTarget(shipManager.state, spaceState);
        if (target) {
            strategy(deltaSeconds, shipManager, target, lastTargetVelocity);
            lastTargetVelocity = XY.clone(target.velocity);
            shipManager.chainGun(isTargetInKillZone(shipManager.state, target));
        } else {
            lastTargetVelocity = XY.zero;
            shipManager.chainGun(false);
        }
    };
}
