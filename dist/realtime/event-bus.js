"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = exports.EventBus = void 0;
const events_1 = require("events");
class EventBus extends events_1.EventEmitter {
    emit(event, data) {
        return super.emit(event, data);
    }
    on(event, listener) {
        return super.on(event, listener);
    }
    off(event, listener) {
        return super.off(event, listener);
    }
    emitTask(event) {
        this.emit('task', event);
        this.emit(event.type, event);
    }
    emitActivity(event) {
        this.emit('activity', event);
        this.emit(event.type, event);
    }
    emitAgent(event) {
        this.emit('agent', event);
        this.emit(event.type, event);
    }
}
exports.EventBus = EventBus;
exports.eventBus = new EventBus();
