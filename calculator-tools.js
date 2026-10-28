(() => {
  const $ = id => document.getElementById(id);
  const tool = document.body.dataset.tool;
  let lastCopy = '';
  const number = value => {
    let s = String(value ?? '').trim().replace(/\s/g, '');
    if (!s) return NaN;
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
    else if (s.includes(',')) s = s.replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  };
  const euro = n => new Intl.NumberFormat('nl-NL', {style:'currency',currency:'EUR'}).format(n);
  const fmt = n => new Intl.NumberFormat('nl-NL', {maximumFractionDigits:4}).format(n);
  const fail = message => {
    $('error').textContent = message;
    $('result-main').textContent = 'Vul je gegevens in';
    $('result-detail').textContent = '';
    lastCopy = '';
  };
  function calculate() {
    $('error').textContent = '';
    const amountField = $('amount');
    const amount = number(amountField.value);
    if (amountField.value.trim() === '' || !Number.isFinite(amount) || amount < 0) {
      fail('Vul een geldig bedrag of getal van 0 of hoger in.');
      amountField.focus();
      return;
    }
    if (tool === 'percentage' || tool === 'discount') {
      const rateField = $('rate');
      const rate = number(rateField.value);
      if (rateField.value.trim() === '' || !Number.isFinite(rate) || rate < 0 || rate > 1000000) {
        fail('Vul een geldig percentage van 0 tot en met 1.000.000 in.');
        rateField.focus();
        return;
      }
      if (tool === 'percentage') {
        const result = amount * rate / 100;
        $('result-label').textContent = fmt(rate) + '% van ' + fmt(amount) + ' is';
        $('result-main').textContent = fmt(result);
        $('result-detail').textContent = 'Berekening: ' + fmt(amount) + ' × ' + fmt(rate) + ' ÷ 100.';
        lastCopy = fmt(result);
      } else {
        if (rate > 100) {
          fail('Een kortingspercentage kan niet hoger zijn dan 100%.');
          rateField.focus();
          return;
        }
        const saving = amount * rate / 100;
        const finalPrice = amount - saving;
        $('result-label').textContent = 'Prijs na ' + fmt(rate) + '% korting';
        $('result-main').textContent = euro(finalPrice);
        $('result-detail').textContent = 'Je bespaart ' + euro(saving) + '. Oorspronkelijke prijs: ' + euro(amount) + '.';
        lastCopy = 'Prijs na korting: ' + euro(finalPrice) + '\nBesparing: ' + euro(saving);
      }
    } else if (tool === 'vat') {
      const rate = number($('rate').value);
      const mode = $('mode').value;
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        fail('Kies een geldig BTW-percentage tussen 0 en 100%.');
        $('rate').focus();
        return;
      }
      let base, vat, total;
      if (mode === 'exclusive') { base = amount; vat = base * rate / 100; total = base + vat; }
      else { total = amount; base = total / (1 + rate / 100); vat = total - base; }
      $('result-label').textContent = mode === 'exclusive' ? 'Bedrag inclusief BTW' : 'Bedrag exclusief BTW';
      $('result-main').textContent = euro(mode === 'exclusive' ? total : base);
      $('result-detail').textContent = 'BTW (' + fmt(rate) + '%): ' + euro(vat) + ' · Exclusief: ' + euro(base) + ' · Inclusief: ' + euro(total) + '.';
      lastCopy = 'Exclusief BTW: ' + euro(base) + '\nBTW (' + fmt(rate) + '%): ' + euro(vat) + '\nInclusief BTW: ' + euro(total);
    }
  }
  function reset() {
    $('tool-form').reset();
    $('error').textContent = '';
    $('result-label').textContent = 'Voorbeeldresultaat';
    $('result-main').textContent = 'Vul je gegevens in';
    $('result-detail').textContent = '';
    $('copy-status').textContent = '';
    lastCopy = '';
  }
  $('calculate').addEventListener('click', calculate);
  $('reset').addEventListener('click', reset);
  $('tool-form').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); calculate(); } });
  $('copy').addEventListener('click', async () => {
    if (!lastCopy) { $('copy-status').textContent = 'Bereken eerst een resultaat.'; return; }
    try {
      await navigator.clipboard.writeText(lastCopy);
      $('copy-status').textContent = 'Resultaat gekopieerd.';
    } catch (error) {
      const area = document.createElement('textarea');
      area.value = lastCopy; area.setAttribute('readonly',''); area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.appendChild(area); area.select();
      const ok = document.execCommand('copy'); area.remove();
      $('copy-status').textContent = ok ? 'Resultaat gekopieerd.' : 'Kopiëren lukte niet. Selecteer het resultaat handmatig.';
    }
  });
  $('tool-form').addEventListener('input', () => { $('error').textContent = ''; $('copy-status').textContent = ''; lastCopy = ''; });
})();