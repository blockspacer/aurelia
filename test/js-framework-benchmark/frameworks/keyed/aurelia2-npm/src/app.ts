import { customElement, ILifecycle } from '@aurelia/runtime';
import template from './app.html';
import { Store } from './source';

let startTime: number;
let lastMeasure: string;
const startMeasure = function (name: string) {
  startTime = performance.now();
  lastMeasure = name;
}
const stopMeasure = function () {
  window.setTimeout(function () {
    var stop = performance.now();
    console.log(lastMeasure + " took " + (stop - startTime));
  }, 0);
}

@customElement({ name: 'app', template })
export class App {
  store: Store;
  constructor(@ILifecycle lifecycle: ILifecycle) {
    this.store = new Store(lifecycle);
  }

  run() {
    startMeasure("run");
    this.store.run();
    stopMeasure();
  }
  add() {
    startMeasure("add");
    this.store.add();
    stopMeasure();
  }
  remove(item: { id: any; }) {
    startMeasure("delete");
    this.store.delete(item.id);
    stopMeasure();
  }
  select(item: { id: any; }) {
    startMeasure("select");
    this.store.select(item.id);
    stopMeasure();
  }
  update() {
    startMeasure("update");
    this.store.update();
    stopMeasure();
  }

  runLots() {
    startMeasure("runLots");
    this.store.runLots();
    stopMeasure();
  }

  clear() {
    startMeasure("clear");
    this.store.clear();
    stopMeasure();
  }

  swapRows() {
    startMeasure("swapRows");
    this.store.swapRows();
    stopMeasure();
  }
}
