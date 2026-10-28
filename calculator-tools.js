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
    $('copy-status').textContent = '';
    if (tool === 'net') {
      const salary = number($('salary').value);
      if ($('salary').value.trim() === '' || !Number.isFinite(salary) || salary < 0 || salary > 1000000) {
        fail('Vul een geldig bruto maandloon in tussen € 0 en € 1.000.000.');
        $('salary').focus();
        return;
      }
      const holidayIncluded = $('holiday').checked;
      const useCredits = $('credits').checked;
      const annualGross = salary * 12 * (holidayIncluded ? 1.08 : 1);
      const tax = Math.min(annualGross, 38883) * 0.3575
        + Math.max(0, Math.min(annualGross - 38883, 39543)) * 0.3756
        + Math.max(0, annualGross - 78426) * 0.495;
      const generalCredit = annualGross <= 29736 ? 3115
        : annualGross < 78426 ? Math.max(0, 3115 - 0.06398 * (annualGross - 29736)) : 0;
      let laborCredit = 0;
      if (annualGross <= 11965) laborCredit = annualGross * 0.08324;
      else if (annualGross <= 25845) laborCredit = 996 + 0.31009 * (annualGross - 11965);
      else if (annualGross <= 45592) laborCredit = 5300 + 0.0195 * (annualGross - 25845);
      else if (annualGross < 132920) laborCredit = Math.max(0, 5685 - 0.06510 * (annualGross - 45592));
      const credits = useCredits ? generalCredit + laborCredit : 0;
      const taxAfterCredits = Math.max(0, tax - credits);
      const netAnnual = Math.max(0, annualGross - taxAfterCredits);
      const netMonthlyAverage = netAnnual / 12;
      $('result-label').textContent = 'Geschat gemiddeld nettoloon per maand';
      $('result-main').textContent = euro(netMonthlyAverage);
      $('result-detail').textContent = 'Bruto jaarloon: ' + euro(annualGross) + ' · geschatte loonheffing na ' + (useCredits ? 'heffingskortingen' : 'zonder heffingskortingen') + ': ' + euro(taxAfterCredits) + ' per jaar. ' + (holidayIncluded ? 'Inclusief 8% vakantiegeld verdeeld over het jaar.' : 'Exclusief vakantiegeld.');
      lastCopy = 'Geschat netto gemiddeld per maand: ' + euro(netMonthlyAverage) + '\nGeschat bruto per jaar: ' + euro(annualGross) + '\nGeschatte loonheffing per jaar: ' + euro(taxAfterCredits);
      $('error').textContent = '';
      return;
    }
    if (tool === 'weighted') {
      const rows = [...document.querySelectorAll('.grade-row')];
      if (!rows.length) { fail('Voeg minimaal één cijfer toe.'); return; }
      let total = 0, weights = 0;
      for (const row of rows) {
        const gradeField = row.querySelector('.grade-input');
        const weightField = row.querySelector('.weight-input');
        const grade = number(gradeField.value), weight = number(weightField.value);
        if (!Number.isFinite(grade) || grade < 1 || grade > 10) { fail('Elk cijfer moet tussen 1 en 10 liggen.'); gradeField.focus(); return; }
        if (!Number.isFinite(weight) || weight <= 0 || weight > 100) { fail('Elke weging moet groter zijn dan 0 en maximaal 100 zijn.'); weightField.focus(); return; }
        total += grade * weight; weights += weight;
      }
      const average = total / weights;
      $('result-label').textContent = 'Gewogen gemiddelde';
      $('result-main').textContent = fmt(average);
      $('result-detail').textContent = 'Som van cijfer × weging: ' + fmt(total) + '. Totale weging: ' + fmt(weights) + '.';
      lastCopy = fmt(average);
      return;
    }
    if (tool === 'needed') {
      const fields = [
        [$('current-grade'), 1, 10, 'Je huidige gemiddelde moet tussen 1 en 10 liggen.'],
        [$('current-weight'), 0.1, 100, 'De huidige weging moet groter zijn dan 0 en maximaal 100 zijn.'],
        [$('target-grade'), 1, 10, 'Je doelgemiddelde moet tussen 1 en 10 liggen.'],
        [$('next-weight'), 0.1, 100, 'De weging van de volgende toets moet groter zijn dan 0 en maximaal 100 zijn.']
      ];
      const values = [];
      for (const [field, min, max, message] of fields) {
        const value = number(field.value);
        if (field.value.trim() === '' || !Number.isFinite(value) || value < min || value > max) { fail(message); field.focus(); return; }
        values.push(value);
      }
      const [current, currentWeight, target, nextWeight] = values;
      const required = (target * (currentWeight + nextWeight) - current * currentWeight) / nextWeight;
      $('result-label').textContent = 'Benodigd cijfer';
      if (required > 10) {
        $('result-main').textContent = '> 10';
        $('result-detail').textContent = 'Dit doel is met alleen de volgende toets niet haalbaar.';
        lastCopy = '> 10, doel niet haalbaar met één toets';
      } else if (required <= 1) {
        $('result-main').textContent = '1,00 of hoger';
        $('result-detail').textContent = 'Een 1 of hoger is voldoende om je doelgemiddelde te bereiken.';
        lastCopy = '1,00 of hoger';
      } else {
        const minimum = Math.ceil((required - 1e-12) * 100) / 100;
        $('result-main').textContent = fmt(minimum);
        $('result-detail').textContent = 'Minimaal benodigd cijfer op twee decimalen; je school kan andere afrondingsregels hanteren.';
        lastCopy = fmt(minimum);
      }
      return;
    }
    if (tool === 'hourly') {
      const wage = number($('amount').value), hours = number($('hours').value);
      if (!Number.isFinite(wage) || wage < 0 || $('amount').value.trim() === '') { fail('Vul een geldig bruto uurloon van 0 of hoger in.'); $('amount').focus(); return; }
      if (!Number.isFinite(hours) || hours <= 0 || hours > 168 || $('hours').value.trim() === '') { fail('Vul uren per week in tussen 0 en 168.'); $('hours').focus(); return; }
      const week = wage * hours, month = wage * hours * 52 / 12, year = wage * hours * 52;
      $('result-label').textContent = 'Bruto salaris bij ' + fmt(hours) + ' uur per week';
      $('result-main').textContent = euro(month) + ' per maand';
      $('result-detail').textContent = 'Per week: ' + euro(week) + ' · Per jaar: ' + euro(year) + '. Exclusief vakantiegeld, toeslagen en inhoudingen.';
      lastCopy = 'Bruto per week: ' + euro(week) + '\nBruto per maand: ' + euro(month) + '\nBruto per jaar: ' + euro(year);
      return;
    }
    if (tool === 'time') {
      const start = $('start').value, end = $('end').value, pause = number($('pause').value);
      const toMinutes = value => {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return NaN;
        const [hours, minutes] = value.split(':').map(Number);
        return hours * 60 + minutes;
      };
      let startMinutes = toMinutes(start), endMinutes = toMinutes(end);
      if (!Number.isFinite(startMinutes)) { fail('Vul een geldige begintijd in.'); $('start').focus(); return; }
      if (!Number.isFinite(endMinutes)) { fail('Vul een geldige eindtijd in.'); $('end').focus(); return; }
      if (!Number.isFinite(pause) || !Number.isInteger(pause) || pause < 0 || pause > 1440 || $('pause').value.trim() === '') { fail('Pauze moet een heel aantal minuten tussen 0 en 1.440 zijn.'); $('pause').focus(); return; }
      if (endMinutes < startMinutes) endMinutes += 1440;
      const minutes = endMinutes - startMinutes - pause;
      if (minutes < 0) { fail('De pauze kan niet langer zijn dan de berekende tijdsduur.'); $('pause').focus(); return; }
      const hours = Math.floor(minutes / 60), remainder = minutes % 60;
      $('result-label').textContent = 'Netto tijdsduur';
      $('result-main').textContent = hours + ' uur ' + remainder + ' min';
      $('result-detail').textContent = 'Totaal: ' + fmt(minutes / 60) + ' uur, inclusief eventuele overgang naar de volgende dag en exclusief pauze.';
      lastCopy = hours + ' uur ' + remainder + ' min';
      return;
    }
    if (tool === 'bmi') {
      const height = number($('height').value), weight = number($('weight').value);
      if (!Number.isFinite(height) || height < 50 || height > 250 || $('height').value.trim() === '') { fail('Vul een lengte in tussen 50 en 250 cm.'); $('height').focus(); return; }
      if (!Number.isFinite(weight) || weight < 2 || weight > 500 || $('weight').value.trim() === '') { fail('Vul een gewicht in tussen 2 en 500 kg.'); $('weight').focus(); return; }
      const bmi = weight / ((height / 100) ** 2);
      $('result-label').textContent = 'BMI (rekenkundige uitkomst)';
      $('result-main').textContent = fmt(bmi);
      $('result-detail').textContent = 'BMI is een globale maat en geen diagnose. Voor personen jonger dan 18 jaar is beoordeling op leeftijd en groei nodig.';
      lastCopy = fmt(bmi);
      return;
    }
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