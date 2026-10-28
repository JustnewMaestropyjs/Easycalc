const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'calculator-tools.js'), 'utf8');

function createCalculator(tool, values = {}, gradeRows = []) {
  const elements = new Map();
  const make = id => {
    if (!elements.has(id)) {
      const initial = values[id];
      elements.set(id, {
        id,
        value: initial === undefined || typeof initial === 'boolean' ? '' : String(initial),
        checked: Boolean(initial),
        hidden: false,
        textContent: '',
        innerHTML: '',
        listeners: {},
        attrs: {},
        style: {},
        addEventListener(type, callback) { this.listeners[type] = callback; },
        setAttribute(name, value) { this.attrs[name] = value; },
        focus() { this.focused = true; },
        select() {},
        remove() {},
      });
    }
    return elements.get(id);
  };

  const form = make('tool-form');
  form.addEventListener = function(type, callback) { this.listeners[type] = callback; };
  form.reset = () => {
    for (const [id, element] of elements) {
      const initial = values[id];
      if (initial !== undefined && typeof initial !== 'boolean') element.value = String(initial);
      if (typeof initial === 'boolean') element.checked = initial;
    }
  };

  const sub = { textContent: '' };
  const document = {
    body: { dataset: { tool } },
    getElementById: make,
    querySelector: selector => selector === '.panel .sub' ? sub : null,
    querySelectorAll: selector => selector === '.grade-row'
      ? gradeRows.map(row => ({
          querySelector: innerSelector => innerSelector === '.grade-input'
            ? { value: String(row.grade), focus() {} }
            : { value: String(row.weight), focus() {} },
        }))
      : [],
    createElement: () => ({ value: '', style: {}, setAttribute() {}, select() {}, remove() {} }),
    execCommand: () => true,
    body: { dataset: { tool }, appendChild() {} },
  };

  const navigator = { clipboard: { writeText: async () => {} } };
  vm.runInNewContext(source, { document, navigator, Intl, Number, String, Math, Array, Object, JSON, console });
  return {
    element: make,
    sub,
    calculate() { make('calculate').listeners.click(); },
    changeMode() { make(tool === 'discount' ? 'discount-mode' : 'percentage-mode').listeners.change?.(); },
  };
}

test('percentage of a number: 15% of 200 is 30', () => {
  const app = createCalculator('percentage', { 'percentage-mode': 'of', amount: '200', rate: '15' });
  app.calculate();
  assert.equal(app.element('result-main').textContent, '30');
});

test('percentage share: 30 out of 200 is 15%', () => {
  const app = createCalculator('percentage', { 'percentage-mode': 'share', amount: '30', rate: '200' });
  app.calculate();
  assert.equal(app.element('result-main').textContent, '15%');
});

test('percentage change: 200 to 150 is a 25% decrease', () => {
  const app = createCalculator('percentage', { 'percentage-mode': 'change', amount: '200', rate: '150' });
  app.calculate();
  assert.equal(app.element('result-main').textContent, '-25%');
});

test('percentage ratio rejects a zero total', () => {
  const app = createCalculator('percentage', { 'percentage-mode': 'share', amount: '30', rate: '0' });
  app.calculate();
  assert.match(app.element('error').textContent, /totaal moet groter zijn dan 0/i);
});

test('discount: €79.95 at 25% gives €59.96 and €19.99 saved', () => {
  const app = createCalculator('discount', { 'discount-mode': 'normal', amount: '79,95', rate: '25', rate2: '10' });
  app.calculate();
  assert.match(app.element('result-main').textContent, /59,96/);
  assert.match(app.element('result-detail').textContent, /19,99/);
});

test('reverse discount: €59.96 after 25% gives original price €79.95', () => {
  const app = createCalculator('discount', { 'discount-mode': 'reverse', amount: '59,96', rate: '25', rate2: '10' });
  app.calculate();
  assert.match(app.element('result-main').textContent, /79,95/);
});

test('reverse discount rejects 100%', () => {
  const app = createCalculator('discount', { 'discount-mode': 'reverse', amount: '0', rate: '100', rate2: '10' });
  app.calculate();
  assert.match(app.element('error').textContent, /100% korting/i);
});

test('stacked discount: 20% then 10% on €100 is €72, effective discount 28%', () => {
  const app = createCalculator('discount', { 'discount-mode': 'stacked', amount: '100', rate: '20', rate2: '10' });
  app.calculate();
  assert.match(app.element('result-main').textContent, /72,00/);
  assert.match(app.element('result-detail').textContent, /28% effectief/);
});

test('weighted average supports decimal comma', () => {
  const app = createCalculator('weighted', {}, [
    { grade: '7', weight: '2' },
    { grade: '8', weight: '1' },
    { grade: '6,5', weight: '1' },
  ]);
  app.calculate();
  assert.equal(app.element('result-main').textContent, '7,125');
});

test('required grade reports an unreachable target above 10', () => {
  const app = createCalculator('needed', {
    'current-grade': '5', 'current-weight': '3', 'target-grade': '8', 'next-weight': '1',
  });
  app.calculate();
  assert.equal(app.element('result-main').textContent, '> 10');
});

test('time calculator handles overnight shifts and breaks', () => {
  const app = createCalculator('time', { start: '23:30', end: '02:15', pause: '30' });
  app.calculate();
  assert.equal(app.element('result-main').textContent, '2 uur 15 min');
});

test('time calculator rejects malformed hours', () => {
  const app = createCalculator('time', { start: '25:00', end: '08:00', pause: '0' });
  app.calculate();
  assert.match(app.element('error').textContent, /geldige begintijd/i);
});

test('VAT: €100 exclusive at 21% totals €121', () => {
  const app = createCalculator('vat', { amount: '100', rate: '21', mode: 'exclusive' });
  app.calculate();
  assert.match(app.element('result-main').textContent, /121,00/);
});

test('hourly wage: €15 × 32 hours is €2,080 average monthly gross', () => {
  const app = createCalculator('hourly', { amount: '15', hours: '32' });
  app.calculate();
  assert.match(app.element('result-main').textContent, /2\.080,00/);
});

test('BMI rejects negative weight', () => {
  const app = createCalculator('bmi', { height: '170', weight: '-2' });
  app.calculate();
  assert.match(app.element('error').textContent, /gewicht/i);
});

test('net pay estimate returns a labeled estimate for a typical monthly salary', () => {
  const app = createCalculator('net', { salary: '3000', credits: true, holiday: false });
  app.calculate();
  assert.match(app.element('result-label').textContent, /Geschat gemiddeld nettoloon/i);
  assert.match(app.element('result-main').textContent, /€/);
  assert.equal(app.element('error').textContent, '');
});

test('weighted average rejects a zero weight', () => {
  const app = createCalculator('weighted', {}, [{ grade: '7', weight: '0' }]);
  app.calculate();
  assert.match(app.element('error').textContent, /weging moet groter zijn dan 0/i);
});

test('weighted average accepts boundary grades 1 and 10', () => {
  const app = createCalculator('weighted', {}, [
    { grade: '1', weight: '1' },
    { grade: '10', weight: '1' },
  ]);
  app.calculate();
  assert.equal(app.element('result-main').textContent, '5,5');
});

test('weighted average rejects a grade above 10', () => {
  const app = createCalculator('weighted', {}, [{ grade: '10,1', weight: '1' }]);
  app.calculate();
  assert.match(app.element('error').textContent, /tussen 1 en 10/i);
});

test('required grade below 1 is reported as 1 or higher', () => {
  const app = createCalculator('needed', {
    'current-grade': '9', 'current-weight': '4', 'target-grade': '7', 'next-weight': '1',
  });
  app.calculate();
  assert.equal(app.element('result-main').textContent, '1,00 of hoger');
});

test('required grade exactly 10 remains achievable', () => {
  const app = createCalculator('needed', {
    'current-grade': '6', 'current-weight': '1', 'target-grade': '8', 'next-weight': '1',
  });
  app.calculate();
  assert.equal(app.element('result-main').textContent, '10');
});

test('VAT inclusive mode extracts 21% VAT from €121', () => {
  const app = createCalculator('vat', { amount: '121', rate: '21', mode: 'inclusive' });
  app.calculate();
  assert.match(app.element('result-main').textContent, /100,00/);
  assert.match(app.element('result-detail').textContent, /21,00/);
});

test('stacked discount rejects a second rate above 100%', () => {
  const app = createCalculator('discount', { 'discount-mode': 'stacked', amount: '100', rate: '20', rate2: '101' });
  app.calculate();
  assert.match(app.element('error').textContent, /tweede kortingspercentage tussen 0 en 100/i);
});

test('time calculator rejects a break longer than the shift', () => {
  const app = createCalculator('time', { start: '09:00', end: '10:00', pause: '61' });
  app.calculate();
  assert.match(app.element('error').textContent, /pauze kan niet langer/i);
});

test('net pay estimate rejects an empty salary', () => {
  const app = createCalculator('net', { salary: '', credits: true, holiday: false });
  app.calculate();
  assert.match(app.element('error').textContent, /geldig bruto maandloon/i);
});
