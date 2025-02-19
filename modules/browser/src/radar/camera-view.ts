import { Application, DisplayObject, IApplicationOptions } from 'pixi.js';

import { Camera } from './camera';
import { Container } from 'golden-layout';
import EventEmitter from 'eventemitter3';
import { XY } from '@starwards/model';

export class CameraView extends Application {
    public events = new EventEmitter<'screenChanged' | 'angleChanged'>();
    private square = false;

    /**
     * @param pixiOptions options for the pixi application
     * @param camera a point in the world that the radar is watching, and a zoom level
     */
    constructor(pixiOptions: IApplicationOptions, public camera: Camera, container: Container) {
        super(pixiOptions);
        this.ticker.maxFPS = 30; // if no limit, then GPU and CPU start heating up and FPS reach ~250
        camera.events.on('view', () => this.events.emit('screenChanged'));
        camera.events.on('angle', () => this.events.emit('angleChanged'));
        container.on('resize', () => {
            this.resizeView(container.width, container.height);
        });
        this.resizeView(container.width, container.height);
        container.getElement().append(this.view);
        this.view.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            return false;
        });
    }

    public worldToScreen = (w: XY) => this.camera.worldToScreen(this.renderer, w.x, w.y);
    public screenToWorld = (s: XY) => this.camera.screenToWorld(this.renderer, s.x, s.y);

    public pixelsToMeters = (p: number) => p / this.camera.zoom;
    public metersToPixles = (m: number) => m * this.camera.zoom;

    public setSquare() {
        this.square = true;
        this.resizeView(this.renderer.width, this.renderer.height);
    }

    private resizeView(width: number, height: number) {
        if (this.square) {
            const side = Math.min(width, height);
            this.renderer.resize(side, side);
        } else {
            this.renderer.resize(width, height);
        }
        this.events.emit('screenChanged');
    }

    public addLayer(child: DisplayObject) {
        this.stage.addChild(child);
    }

    public get radius() {
        return Math.min(this.renderer.width, this.renderer.height) / 2;
    }
}
