import { Explosion } from './explosion';
import { SpaceObjectBase } from './space-object-base';
import { Vec2 } from './vec2';
import { type } from '@colyseus/schema';
export class CannonShell extends SpaceObjectBase {
    public static isInstance = (o: SpaceObjectBase): o is CannonShell => {
        return o.type === 'CannonShell';
    };

    @type('float32')
    public secondsToLive = 0;

    public readonly type = 'CannonShell';
    @type('uint16')
    public health = 0;

    constructor(public _explosion?: Explosion) {
        super();
        this.health = 10;
        this.radius = 1;
    }

    init(id: string, position: Vec2): this {
        this.id = id;
        this.position = position;
        return this;
    }
}
