(() => {
  'use strict';

  const root = document.querySelector('#root');
  const download = '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>';
  const layout = '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16m-9 0v11"/>';
  const user = '<circle cx="12" cy="8" r="3"/><path d="M5 20v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/>';
  const edit = '<path d="m16 4 4 4M5 15 16 4a2.8 2.8 0 0 1 4 4L9 19l-5 1 1-5Z"/>';
  const qr = '<path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h3v3m3-3v6h-6v-3"/>';
  const sparkle = '<path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2Z"/>';
  const portrait = '<rect x="6" y="3" width="12" height="18" rx="2"/>';
  const landscape = '<rect x="3" y="6" width="18" height="12" rx="2"/>';
  const icon = (shape) => '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + shape + '</svg>';

  root.className = 'editor';
  root.innerHTML = `
    <header class="app-header">
      <div class="header-brand">
        <span class="brand-mark"><img src="assets/unicef-mark.svg" alt="UNICEF"></span>
        <h1 tabindex="-1">Božićna potvrda o donaciji</h1>
      </div>
      <div class="header-actions" aria-label="Izvoz potvrde">
        <button class="button" type="button" data-export="png">${icon(download)} Preuzmi PNG</button>
        <button class="button primary" type="button" data-export="pdf">${icon(download)} Preuzmi PDF</button>
      </div>
    </header>
    <div class="workspace">
      <form class="controls" aria-labelledby="editor-title" novalidate>
        <div class="controls-intro">
          <h2 id="editor-title">Uredi potvrdu</h2>
          <p>Odaberi format i prilagodi poruku za primatelja.</p>
        </div>
        <section class="panel" aria-labelledby="format-title">
          <h3 id="format-title">${icon(layout)} Format potvrde</h3>
          <div class="fields">
            <div class="field">
              <label for="format">Veličina papira ili fotografije</label>
              <select id="format">
                <optgroup label="Standardni papiri">
                  <option value="A4" selected>A4 (210 × 297 mm)</option>
                  <option value="A5">A5 (148 × 210 mm)</option>
                  <option value="A6">A6 (105 × 148 mm)</option>
                </optgroup>
                <optgroup label="Formati fotografija">
                  <option value="9x13cm">9 × 13 cm</option>
                  <option value="10x15cm">10 × 15 cm</option>
                  <option value="13x18cm">13 × 18 cm</option>
                  <option value="15x21cm">15 × 21 cm</option>
                  <option value="20x30cm">20 × 30 cm</option>
                </optgroup>
              </select>
            </div>
            <fieldset class="field fieldset">
              <legend>Orijentacija</legend>
              <div class="segmented">
                <label><input type="radio" name="orientation" value="portrait" checked>${icon(portrait)} Uspravno</label>
                <label><input type="radio" name="orientation" value="landscape">${icon(landscape)} Položeno</label>
              </div>
            </fieldset>
          </div>
        </section>
        <section class="panel" aria-labelledby="personal-title">
          <h3 id="personal-title">${icon(user)} Personalizacija</h3>
          <div class="fields">
            <div class="field">
              <label for="recipient">Ime primatelja</label>
              <input id="recipient" maxlength="100" autocomplete="off" placeholder="npr. Ana">
            </div>
            <div class="field">
              <label for="donor">Ime donatora/ice</label>
              <input id="donor" maxlength="100" autocomplete="off" placeholder="npr. Petra">
            </div>
            <div class="field">
              <label for="gender">Rod glagola</label>
              <select id="gender">
                <option value="female">Ženski (poklonila / uplatila)</option>
                <option value="male">Muški (poklonio / uplatio)</option>
                <option value="neutral">Neutralno (poklanja / uplaćuje)</option>
              </select>
            </div>
            <div class="field">
              <label for="address-style">Način obraćanja</label>
              <select id="address-style">
                <option value="formal">Na Vi</option>
                <option value="informal">Na ti</option>
              </select>
            </div>
            <div class="field">
              <label class="toggle"><input type="checkbox" id="show-amount"> Prikaži iznos donacije na potvrdi</label>
              <div class="field" id="amount-field" hidden>
                <label for="amount">Iznos donacije</label>
                <input id="amount" maxlength="45" autocomplete="off" placeholder="npr. 50 €">
              </div>
            </div>
          </div>
        </section>
        <details class="panel" open>
          <summary>${icon(edit)} Predložak i tekst</summary>
          <div class="fields">
            <div class="field">
              <label for="template">Predložak</label>
              <select id="template">
                <option value="warm">Topli blagdanski</option>
                <option value="formal">Službena potvrda o donaciji</option>
                <option value="short">Kratki / minimalistički</option>
              </select>
            </div>
            <details>
              <summary>Uredi tekst potvrde</summary>
              <div class="fields">
                <p class="hint" id="token-help">Zadrži [Ime primatelja] i [Ime donatora/ice] za automatski unos imena. Prazna polja izostavit će se s potvrde.</p>
                <div class="field"><label for="kicker">Nadnaslov</label><input id="kicker" data-copy maxlength="100" aria-describedby="token-help"></div>
                <div class="field"><label for="title">Naslov</label><input id="title" data-copy maxlength="180" aria-describedby="token-help"></div>
                <div class="field">
                  <label for="message">Glavni tekst</label>
                  <textarea id="message" data-copy rows="8" maxlength="1800" aria-describedby="token-help message-help"></textarea>
                  <p class="hint" id="message-help">Započni novi redak za novi odlomak.</p>
                </div>
                <div class="field"><label for="greeting">Blagdanski pozdrav</label><input id="greeting" data-copy maxlength="180"></div>
                <div class="field"><label for="signature">Potpis</label><input id="signature" data-copy maxlength="100"></div>
                <button class="button inline-action" type="button" id="reset-copy">Vrati izvorni tekst</button>
              </div>
            </details>
          </div>
        </details>
        <details class="panel" open>
          <summary>${icon(qr)} QR kod za donacije</summary>
          <div class="fields">
            <div class="field">
              <label for="qr-mode">Prikaz QR koda</label>
              <select id="qr-mode">
                <option value="url">Generiraj iz poveznice</option>
                <option value="file">Učitaj vlastitu sliku</option>
                <option value="none">Bez QR koda</option>
              </select>
            </div>
            <div class="field" id="qr-url-field">
              <label for="qr-url">Poveznica za doniranje</label>
              <input id="qr-url" type="url" maxlength="500" value="https://www.unicef.hr/donirajte" spellcheck="false" aria-describedby="qr-error">
            </div>
            <div class="field" id="qr-file-field" hidden>
              <label for="qr-file">Učitaj ili zamijeni sliku QR koda</label>
              <input id="qr-file" type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" aria-describedby="qr-error">
            </div>
            <p class="feedback" id="qr-error" role="status" hidden></p>
            <div class="field" id="qr-copy-fields">
              <label for="qr-title">Naslov uz QR kod</label>
              <input id="qr-title" maxlength="85" value="Nastavite lanac dobrote">
              <label for="qr-caption">Tekst uz QR kod</label>
              <textarea id="qr-caption" rows="3" maxlength="230">Skenirajte QR kod i donirajte za djecu kojoj je pomoć najpotrebnija.</textarea>
            </div>
          </div>
        </details>
        <details class="panel">
          <summary>${icon(sparkle)} Ilustracije i logotip</summary>
          <div class="fields">
            <div class="field">
              <label for="decoration">Blagdanske ilustracije</label>
              <select id="decoration">
                <option value="classic">Djedova kapa i drvce</option>
                <option value="candle">Svijeća i zvjezdice</option>
                <option value="mistletoe">Imela i kuglice</option>
                <option value="none">Bez ilustracija</option>
              </select>
            </div>
            <div class="field">
              <label for="logo-file">Vlastiti logotip (PNG ili SVG)</label>
              <input id="logo-file" type="file" accept=".png,.svg,image/png,image/svg+xml" aria-describedby="logo-error">
              <p class="feedback" id="logo-error" role="status" hidden></p>
              <button class="button inline-action" type="button" id="reset-logo" hidden>Vrati UNICEF logotip</button>
            </div>
          </div>
        </details>
      </form>
      <section class="preview" aria-labelledby="preview-title">
        <div class="preview-header">
          <h2 id="preview-title">Pregled potvrde</h2>
          <span class="preview-spec" id="preview-spec"></span>
        </div>
        <div class="stage">
          <div class="paper-frame">
            <article class="certificate" aria-label="Božićna potvrda o donaciji">
              <img class="cert-art left" alt=""><img class="cert-art right" alt="">
              <div class="cert-main">
                <div class="cert-story">
                  <p class="cert-kicker"></p>
                  <h3 class="cert-title"></h3>
                  <div class="cert-message"></div>
                  <p class="cert-greeting"></p>
                  <p class="cert-signature"></p>
                  <p class="cert-amount"></p>
                </div>
              </div>
              <footer class="cert-foot">
                <div class="cert-qr" hidden>
                  <div class="qr-paper"><img alt="QR kod za doniranje"></div>
                  <div class="cert-qr-copy"><h3></h3><p></p></div>
                </div>
                <div class="cert-logo"><img src="assets/unicef-hr.png" alt="UNICEF – za svako dijete" width="1203" height="150"></div>
              </footer>
            </article>
          </div>
        </div>
        <div class="preview-footer">
          <span id="print-size"></span>
          <output id="export-status" role="status"></output>
        </div>
      </section>
    </div>`;
  document.body.classList.remove('locked');
  root.querySelector('h1').focus({ preventScroll: true });

  const script = document.createElement('script');
  script.src = 'certificate.js';
  script.onerror = () => {
    const status = document.querySelector('#export-status');
    status.textContent = 'Uređivač se nije učitao. Osvježite stranicu.';
    status.dataset.error = '';
  };
  document.head.append(script);
})();
