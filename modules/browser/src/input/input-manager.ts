import '@maulingmonkey/gamepad';

import {
    GamepadAxisConfig,
    GamepadButtonConfig,
    KeysStepsConfig,
    RangeConfig,
    isGamepadButtonsRangeConfig,
} from './input-config';
import { capToRange, isInRange } from '@starwards/model';

import { EmitterLoop } from '../loop';
import hotkeys from 'hotkeys-js';

type AxisListener = { axis: GamepadAxisConfig; range: [number, number]; setValue: (v: number) => unknown };
type ButtonListener = { button: GamepadButtonConfig; setValue?: (v: boolean) => unknown; onClick?: () => unknown };
type KeyListener = { key: string; setValue?: (v: boolean) => unknown; onClick?: () => unknown };

// equiv. to lerp([-1, 1], range, axisValue)
function lerpAxisToRange(range: [number, number], axisValue: number) {
    const t = (axisValue + 1) / 2;
    return (1 - t) * range[0] + t * range[1];
}
export interface RangeAction {
    range: [number, number];
    setValue: (v: number) => unknown;
}
export interface TriggerAction {
    setValue: (v: boolean) => unknown;
}
export interface StepAction {
    setValue: (v: number) => unknown;
}
export class InputManager {
    private axes: AxisListener[] = [];
    private buttons: ButtonListener[] = [];
    private keys: KeyListener[] = [];
    private loop = new EmitterLoop(1000 / 10);
    private readonly onButton = (e: mmk.gamepad.GamepadButtonEvent & CustomEvent<undefined>): void => {
        for (const listener of this.buttons) {
            if (e.buttonIndex === listener.button.buttonIndex && e.gamepadIndex === listener.button.gamepadIndex) {
                const value = Boolean(e.buttonValue);
                if (listener.setValue) {
                    listener.setValue(value);
                }
                if (value && listener.onClick) {
                    listener.onClick();
                }
            }
        }
    };
    private readonly onAxis = (e: mmk.gamepad.GamepadAxisEvent & CustomEvent<undefined>): void => {
        for (const listener of this.axes) {
            if (e.axisIndex === listener.axis.axisIndex && e.gamepadIndex === listener.axis.gamepadIndex) {
                let value = e.axisValue;
                if (listener.axis.inverted) {
                    value = -value;
                }
                if (listener.axis.deadzone && isInRange(listener.axis.deadzone[0], listener.axis.deadzone[1], value)) {
                    value = 0;
                }
                value = lerpAxisToRange(listener.range, value);
                listener.setValue(value);
            }
        }
    };

    init() {
        this.loop.start();
        addEventListener('mmk-gamepad-button-value', this.onButton);
        addEventListener('mmk-gamepad-axis-value', this.onAxis);
        for (const key of this.keys) {
            hotkeys(key.key, { keyup: true }, (e) => {
                const value = e.type === 'keydown';
                if (value && key.onClick) {
                    key.onClick();
                }
                if (key.setValue) {
                    key.setValue(value);
                }
            });
        }
    }

    destroy() {
        removeEventListener('mmk-gamepad-axis-value', this.onAxis);
        removeEventListener('mmk-gamepad-button-value', this.onButton);
        hotkeys.unbind(); // unbind everything
        this.loop.stop();
    }

    addRangeAction(property: RangeAction, range: RangeConfig | undefined) {
        if (range) {
            const { axis, buttons, keys } = range;
            if (buttons || keys || axis?.velocity) {
                const callbacks = new CombinedRangeCallbacks(property);
                if (buttons) {
                    buttons.center && this.buttons.push({ button: buttons.center, onClick: callbacks.centerOffset });
                    if (isGamepadButtonsRangeConfig(buttons)) {
                        const step = getStepOfRange(buttons.step, property.range);
                        this.buttons.push({ button: buttons.up, onClick: callbacks.upOffset(step) });
                        this.buttons.push({ button: buttons.down, onClick: callbacks.downOffset(step) });
                    }
                }
                if (keys) {
                    const step = getStepOfRange(keys.step, property.range);
                    this.keys.push({ key: keys.center, onClick: callbacks.centerOffset });
                    this.keys.push({ key: keys.up, onClick: callbacks.upOffset(step) });
                    this.keys.push({ key: keys.down, onClick: callbacks.downOffset(step) });
                }
                if (axis) {
                    if (axis.velocity) {
                        this.axes.push({
                            axis,
                            range: property.range,
                            setValue: callbacks.offsetVelocity(this.loop),
                        });
                    } else {
                        this.axes.push({ axis, range: property.range, setValue: callbacks.axis });
                    }
                }
            } else if (axis) {
                this.axes.push({ axis, ...property });
            }
        }
    }

    addButtonAction(property: TriggerAction, button: GamepadButtonConfig | undefined) {
        if (button) {
            this.buttons.push({ button, ...property });
        }
    }

    addKeyAction(property: TriggerAction, key: string | undefined) {
        if (key) {
            this.keys.push({ key, setValue: property.setValue });
        }
    }

    addStepsAction(property: StepAction, key: KeysStepsConfig | undefined) {
        if (key) {
            this.keys.push({ key: key.up, onClick: () => void property.setValue(key.step) });
            this.keys.push({ key: key.down, onClick: () => void property.setValue(-key.step) });
        }
    }
}

function getStepOfRange(step: number, range: [number, number]) {
    return (step * (range[1] - range[0])) / 2;
}
class CombinedRangeCallbacks {
    private readonly midRange = lerpAxisToRange(this.property.range, 0);
    private axisValue = this.midRange;
    private offsetValue = this.midRange;

    constructor(private property: RangeAction) {}
    private onChange() {
        this.property.setValue(this.axisValue + this.offsetValue);
    }
    centerOffset = () => {
        this.offsetValue = this.midRange;
        this.onChange();
    };
    upOffset(stepSize: number) {
        return () => {
            this.offsetValue = capToRange(this.property.range[0], this.property.range[1], this.offsetValue + stepSize);
            this.onChange();
        };
    }
    downOffset(stepSize: number) {
        return () => {
            this.offsetValue = capToRange(this.property.range[0], this.property.range[1], this.offsetValue - stepSize);
            this.onChange();
        };
    }
    axis = (v: number) => {
        this.axisValue = v;
        this.onChange();
    };

    offsetVelocity(loop: EmitterLoop) {
        let velocity = 0;
        loop.onLoop((deltaSeconds) => {
            if (velocity != 0) {
                this.offsetValue = capToRange(
                    this.property.range[0],
                    this.property.range[1],
                    this.offsetValue + velocity * deltaSeconds
                );
                this.onChange();
            }
        });
        return (v: number) => {
            velocity = v;
        };
    }
}
