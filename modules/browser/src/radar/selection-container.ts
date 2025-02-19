import EventEmitter from 'eventemitter3';
import { SpaceDriver } from '../driver';
import { SpaceObject } from '@starwards/model';

export class SelectionContainer {
    /**
     * emits an event after an object chnanges its selection state
     * event name is the object's ID
     */
    public events = new EventEmitter();
    /**
     * currently selected objects
     */
    public selectedItems = new Set<SpaceObject>();

    public get selectedItemsIds() {
        return [...this.selectedItems].map((o) => o.id);
    }

    init(spaceDriver: SpaceDriver) {
        spaceDriver.events.on('remove', (spaceObject: SpaceObject) => {
            if (this.selectedItems.delete(spaceObject)) {
                this.events.emit(spaceObject.id);
                this.events.emit('changed');
            }
        });
        return this;
    }

    public clear() {
        const changed = [...this.selectedItems];
        this.selectedItems.clear();
        if (changed.length) {
            for (const spaceObject of changed) {
                this.events.emit(spaceObject.id);
            }
            this.events.emit('changed');
        }
    }

    public set(selected: SpaceObject[]) {
        const changed = selected.filter((so) => !this.selectedItems.delete(so)).concat(...this.selectedItems);
        this.selectedItems.clear();
        for (const spaceObject of selected) {
            this.selectedItems.add(spaceObject);
        }
        if (changed.length) {
            for (const spaceObject of changed) {
                this.events.emit(spaceObject.id);
            }
            this.events.emit('changed');
        }
    }

    public has(o: SpaceObject) {
        return this.selectedItems.has(o);
    }

    public getSingle() {
        return this.selectedItems.values().next().value as SpaceObject | undefined;
    }
}
