import { CustomElement } from '@aurelia/runtime';
import { assert, fail, getVisibleText } from '@aurelia/testing';
import { App } from './app/app';
import { startup, TestExecutionContext } from './app/startup';

describe('app', function () {

  function getViewModel<T>(element: Element) {
    const { viewModel } = CustomElement.behaviorFor(element) as unknown as { viewModel: T };
    return viewModel;
  }

  async function executeTest(testFunction: (ctx: TestExecutionContext) => Promise<void> | void) {
    const ctx = await startup();
    try {
      await testFunction(ctx);
    } catch (e) {
      fail(e);
    } finally {
      await ctx.tearDown();
    }
  }

  it('has some readonly texts with different binding modes', async function () {
    await executeTest(({ host }) => {
      for (let i = 0; i < 4; i++) {
        const selector = `read-only-text#text${i}`;
        assert.html.textContent(selector, `text${i}`, `incorrect text for ${selector}`, host);
      }
    });
  });

  it('changes in bound VM properties are correctly reflected in the read-only-texts', async function () {
    await executeTest(async ({ host, ctx }) => {
      (host.querySelector('button#staticTextChanger') as unknown as HTMLButtonElement).click();
      await ctx.lifecycle.nextFrame;

      assert.html.textContent('read-only-text#text0', 'text0', 'incorrect text for read-only-text#text0', host);
      assert.html.textContent('read-only-text#text1', 'text1', 'incorrect text for read-only-text#text1', host);
      assert.html.textContent('read-only-text#text2', 'newText2', 'incorrect text for read-only-text#text2', host);
      assert.html.textContent('read-only-text#text3', 'newText3', 'incorrect text for read-only-text#text3', host);
    });
  });

  it('has some textual inputs with different binding modes', async function () {
    await executeTest(({ host }) => {
      const _static: HTMLInputElement = host.querySelector('#input-static input');
      const oneTime: HTMLInputElement = host.querySelector('#input-one-time input');
      const twoWay: HTMLInputElement = host.querySelector('#input-two-way input');
      const toView: HTMLInputElement = host.querySelector('#input-to-view input');
      const fromView: HTMLInputElement = host.querySelector('#input-from-view input');
      const blurredInputTw: HTMLInputElement = host.querySelector('#blurred-input-two-way input');
      const blurredInputFv: HTMLInputElement = host.querySelector('#blurred-input-from-view input');

      const vm = getViewModel<App>(host);

      assert.html.value(_static, 'input0');
      assert.html.value(oneTime, vm.inputOneTime);
      assert.html.value(twoWay, vm.inputTwoWay);
      assert.html.value(toView, vm.inputToView);
      assert.html.value(fromView, '');
      assert.html.value(blurredInputTw, vm.inputBlrTw);
      assert.html.value(blurredInputFv, '');
    });
  });

  it('changes in the text-input are reflected correctly as per binding mode', async function () {
    await executeTest(async ({ host, ctx }) => {
      const oneTime: HTMLInputElement = host.querySelector('#input-one-time input');
      const twoWay: HTMLInputElement = host.querySelector('#input-two-way input');
      const toView: HTMLInputElement = host.querySelector('#input-to-view input');
      const fromView: HTMLInputElement = host.querySelector('#input-from-view input');

      const newInputs = new Array(4).fill(0).map((_, i) => `new input ${i + 1}`);

      oneTime.value = newInputs[0];
      oneTime.dispatchEvent(new Event('change'));

      twoWay.value = newInputs[1];
      twoWay.dispatchEvent(new Event('change'));

      toView.value = newInputs[2];
      toView.dispatchEvent(new Event('change'));

      fromView.value = newInputs[3];
      fromView.dispatchEvent(new Event('change'));

      ctx.lifecycle.processRAFQueue(undefined);

      const vm = getViewModel<App>(host);
      assert.equal(vm.inputOneTime, 'input1');
      assert.equal(vm.inputTwoWay, newInputs[1]);
      assert.equal(vm.inputToView, 'input3');
      assert.equal(vm.inputFromView, newInputs[3]);
    });
  });

  it('changes in the vm property are reflected in text-inputs correctly as per binding mode', async function () {
    await executeTest(async ({ host, ctx }) => {
      const newInputs = new Array(4).fill(0).map((_, i) => `new input ${i + 1}`);
      const vm = getViewModel<App>(host);
      vm.inputOneTime = newInputs[0];
      vm.inputTwoWay = newInputs[1];
      vm.inputToView = newInputs[2];
      vm.inputFromView = newInputs[3];

      ctx.lifecycle.processRAFQueue(undefined);

      const oneTime: HTMLInputElement = host.querySelector('#input-one-time input');
      const twoWay: HTMLInputElement = host.querySelector('#input-two-way input');
      const toView: HTMLInputElement = host.querySelector('#input-to-view input');
      const fromView: HTMLInputElement = host.querySelector('#input-from-view input');

      assert.html.value(oneTime, 'input1');
      assert.html.value(twoWay, newInputs[1]);
      assert.html.value(toView, newInputs[2]);
      assert.html.value(fromView, '');
    });
  });

  it('changes in the text-input are reflected correctly according to update-trigger event', async function () {
    await executeTest(async ({ host, ctx }) => {
      const twoWay: HTMLInputElement = host.querySelector('#blurred-input-two-way input');
      const fromView: HTMLInputElement = host.querySelector('#blurred-input-from-view input');

      const vm = getViewModel<App>(host);
      assert.html.value(twoWay, vm.inputBlrTw);
      assert.html.value(fromView, '');

      const newInputFv = 'new blurred input fv', newInputTw = 'new blurred input tw';
      twoWay.value = newInputTw;
      twoWay.dispatchEvent(new Event('change'));
      fromView.value = newInputFv;
      fromView.dispatchEvent(new Event('change'));
      ctx.lifecycle.processRAFQueue(undefined);

      assert.notEqual(vm.inputBlrTw, newInputTw);
      assert.notEqual(vm.inputBlrFv, newInputFv);

      twoWay.dispatchEvent(new Event('blur'));
      fromView.dispatchEvent(new Event('blur'));
      ctx.lifecycle.processRAFQueue(undefined);

      assert.equal(vm.inputBlrTw, newInputTw);
      assert.equal(vm.inputBlrFv, newInputFv);
    });
  });

  it.skip('uses specs-viewer to \'compose\' display for heterogenous collection of things', async function () {
    await executeTest(({ host }) => {
      const specsViewer = host.querySelector('specs-viewer');
      assert.notEqual(specsViewer, null);
      console.log(specsViewer.outerHTML);

      const vm = getViewModel<App>(host);
      const [camera, laptop] = vm.things;
      assert.html.textContent('h2', `${camera.modelNumber} by ${camera.make}`, 'incorrect text', specsViewer);
    });
  });

  it('uses a user preference control that \'computes\' the full name of the user correctly - static', async function () {
    await executeTest(async ({ host, ctx }) => {

      const { user } = getViewModel<App>(host);

      const userPref = host.querySelector('user-preference');

      const statc = userPref.querySelector('#static');
      const nonStatic = userPref.querySelector('#nonStatic');
      const wrongStatic = userPref.querySelector('#wrongStatic');

      assert.html.textContent(statc, 'John Doe', 'incorrect text statc');
      assert.html.textContent(nonStatic, 'infant', 'incorrect text nonStatic');
      assert.html.textContent(wrongStatic, 'infant', 'incorrect text wrongStatic');

      const { changes: uc } = user;
      uc.clear();
      user.firstName = 'Jane';
      ctx.lifecycle.processRAFQueue(undefined);
      assert.html.textContent(statc, 'Jane Doe', 'incorrect text statc - fname');
      assert.html.textContent(nonStatic, 'infant', 'incorrect text nonStatic - fname');
      assert.html.textContent(wrongStatic, 'infant', 'incorrect text wrongStatic - fname');
      assert.equal(uc.has('static'), true, 'static change should have triggered - fname');
      assert.equal(uc.has('nonStatic'), false, 'nonStatic change should not have triggered - fname');
      assert.equal(uc.has('wrongStatic'), false, 'wrongStatic change should not have triggered - fname');

      uc.clear();
      user.age = 10;
      ctx.lifecycle.processRAFQueue(undefined);
      assert.html.textContent(statc, 'Jane Doe', 'incorrect text statc - age');
      assert.html.textContent(nonStatic, 'Jane Doe', 'incorrect text nonStatic - age');
      assert.html.textContent(wrongStatic, 'Jane Doe', 'incorrect text wrongStatic - age');
      assert.equal(uc.has('static'), false, 'static change should not have triggered - age');
      assert.equal(uc.has('nonStatic'), true, 'nonStatic change should have triggered - age');
      assert.equal(uc.has('wrongStatic'), true, 'wrongStatic change should have triggered - age');

      uc.clear();
      user.lastName = 'Smith';
      ctx.lifecycle.processRAFQueue(undefined);
      assert.html.textContent(statc, 'Jane Smith', 'incorrect text statc - lname');
      assert.html.textContent(nonStatic, 'Jane Smith', 'incorrect text nonStatic - lname');
      assert.html.textContent(wrongStatic, 'Jane Doe', 'incorrect text wrongStatic - lname');
      assert.equal(uc.has('static'), true, 'static change should have triggered - lname');
      assert.equal(uc.has('nonStatic'), true, 'nonStatic change should have triggered - lname');
      assert.equal(uc.has('wrongStatic'), false, 'wrongStatic change should have triggered - lname');
    });
  });

  it('uses a user preference control that \'computes\' the organization of the user correctly - volatile', async function () {
    await executeTest(async ({ host, ctx }) => {

      const { user } = getViewModel<App>(host);

      const userPref = host.querySelector('user-preference');

      const nonVolatile = userPref.querySelector('#nonVolatile');
      const volatile = userPref.querySelector('#volatile');

      assert.html.textContent(nonVolatile, 'Role1, Org1', 'incorrect text nonVolatile');
      assert.html.textContent(volatile, 'City1, Country1', 'incorrect text volatile');

      const { changes: uc } = user;
      uc.clear();
      user.roleNonVolatile = 'Role2';
      user.locationVolatile = 'Country2';
      ctx.lifecycle.processRAFQueue(undefined);
      assert.html.textContent(nonVolatile, 'Role2, Org1', 'incorrect text nonVolatile - role');
      assert.html.textContent(volatile, 'City1, Country2', 'incorrect text volatile - country');
      assert.equal(uc.has('nonVolatile'), true, 'nonVolatile change should have triggered - role');
      assert.equal(uc.has('volatile'), true, 'volatile change should have triggered - country');

      uc.clear();
      user.organization = 'Org2'
      user.city = 'City2';
      ctx.lifecycle.processRAFQueue(undefined);
      assert.html.textContent(nonVolatile, 'Role2, Org1', 'incorrect text nonVolatile - role');
      assert.html.textContent(volatile, 'City2, Country2', 'incorrect text volatile - country');
      assert.equal(uc.has('nonVolatile'), false, 'nonVolatile change should not have triggered - role');
      assert.equal(uc.has('volatile'), true, 'volatile change should have triggered - country');
    });
  });
});
