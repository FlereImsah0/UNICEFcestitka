(() => {
  'use strict';

  const find = (selector) => document.querySelector(selector);
  const field = (id) => document.getElementById(id);
  const value = (id) => field(id).value.trim();
  const card = find('.certificate');
  const story = find('.cert-story');
  const stage = find('.stage');
  const frame = find('.paper-frame');
  const qrImage = find('.qr-paper img');
  const logo = find('.cert-logo img');
  const defaultLogo = logo.getAttribute('src');
  const defaultLogoAlt = logo.alt;
  const exportButtons = [...document.querySelectorAll('[data-export]')];

  const formats = {
    A4: [210, 297], A5: [148, 210], A6: [105, 148],
    '9x13cm': [90, 130], '10x15cm': [100, 150], '13x18cm': [130, 180],
    '15x21cm': [150, 210], '20x30cm': [200, 300]
  };
  const templates = {
    warm: {
      title: 'Za [Ime primatelja]',
      message: [
        'Ove godine pod borom Vas ne čeka još jedan predmet, već nešto što traje mnogo dulje.',
        'U Vaše ime uplaćena je donacija za pomoć djeci kojoj su potrebni podrška, zaštita i prilika za sretnije odrastanje.',
        'Dobrota koju je poklonila [Ime donatora/ice] pretvorit će se u konkretnu pomoć ondje gdje je najpotrebnija.',
        'Najljepši pokloni ponekad nisu oni koje primamo, nego oni koje zajedno darujemo drugima.'
      ].join('\n'),
      greeting: 'Sretan Božić!'
    },
    formal: {
      kicker: 'POTVRDA O DONACIJI',
      title: 'Božićni dar koji mijenja živote',
      message: [
        'Ovim putem potvrđujemo da je [Ime donatora/ice] povodom božićnih blagdana uplatila donaciju za pomoć djeci kroz UNICEF u ime [Ime primatelja].',
        'Ovaj poklon predstavlja doprinos stvaranju boljih prilika za djecu te nosi poruku solidarnosti, nade i zajedništva.',
        'Vaše ime postalo je dio priče koja mijenja dječje živote nabolje.'
      ].join('\n'),
      greeting: 'Sretan Božić i hvala što ste dio ovog plemenitog čina.',
      signature: 'UNICEF Hrvatska'
    },
    short: {
      title: 'Sretan Božić, [Ime primatelja]!',
      message: 'Umjesto klasičnog poklona, [Ime donatora/ice] daruje ono najvrjednije – podršku i sigurnije djetinjstvo djeci kojoj je pomoć najpotrebnija.'
    }
  };
  const decorations = { classic: ['hat', 'tree'], candle: ['candle', 'stars'], mistletoe: ['mistletoe', 'ornaments'] };
  const verbs = {
    female: ['poklonila', 'uplatila'],
    male: ['poklonio', 'uplatio'],
    neutral: ['poklanja', 'uplaćuje']
  };
  const copyFields = [...document.querySelectorAll('[data-copy]')];
  const drafts = {};
  let pendingExport = false;
  let fontsReady = false;
  let qrReady = false;
  let storyTooLong = false;
  let qrCopyTooLong = false;
  let qrRevision = 0;
  let uploadRevision = 0;
  let logoRevision = 0;
  let uploadedQr = '';
  let qrUploadMessage = '';
  let currentQrKey;
  let dimensions;

  const libraries = {
    qr: { file: 'qrcode.min.js', get: () => window.QRCode },
    canvas: {
      file: 'html2canvas.min.js',
      cdn: 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
      integrity: 'sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H',
      get: () => window.html2canvas
    },
    pdf: {
      file: 'jspdf.umd.min.js',
      cdn: 'https://cdn.jsdelivr.net/npm/jspdf@4.2.1/dist/jspdf.umd.min.js',
      integrity: 'sha384-qovJwSBbRDPP5cEjCp8S0UP66wrvnjaa60XMOGzTNanrThcrGfXfnZkvgY8N1KT3',
      get: () => window.jspdf?.jsPDF
    }
  };

  function loadScript(src, integrity) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timeout = setTimeout(fail, 5500);
      function fail() {
        clearTimeout(timeout);
        script.remove();
        reject(new Error('Failed to load ' + src));
      }
      script.onload = () => {
        clearTimeout(timeout);
        resolve();
      };
      script.onerror = fail;
      if (integrity) {
        script.integrity = integrity;
        script.crossOrigin = 'anonymous';
      }
      script.src = src;
      document.head.append(script);
    });
  }

  function loadLibrary(name) {
    const library = libraries[name];
    if (!library.promise) {
      library.promise = (async () => {
        if (library.cdn && location.protocol !== 'file:') {
          try { await loadScript(library.cdn, library.integrity); } catch {}
        }
        if (!library.get()) await loadScript('vendor/' + library.file);
        if (!library.get()) throw new Error('Library unavailable: ' + name);
        return library.get();
      })().catch((error) => {
        delete library.promise;
        throw error;
      });
    }
    return library.promise;
  }

  function setText(el, copy) {
    el.textContent = copy;
    el.hidden = !copy;
  }

  function loadTemplate(reset = false) {
    const active = value('template');
    if (reset) delete drafts[active];
    const copy = drafts[active] || templates[active];
    for (const input of copyFields) input.value = copy[input.id] ?? '';
  }

  function personalize(copy) {
    const [gift, paid] = verbs[value('gender')];
    if (value('gender') === 'neutral') {
      copy = copy.replace(/\bda je (\[Ime donatora\/ice\])([^.!?;\n]*?)\buplatila\b/giu, 'da $1$2uplaćuje');
      copy = copy.replace(/\bkoju je poklonila\b/giu, 'koju poklanja');
    }
    return addressRecipient(copy)
      .replace(/\bpoklonila\b/giu, (word) => word[0] === 'P' ? gift[0].toUpperCase() + gift.slice(1) : gift)
      .replace(/\buplatila\b/giu, (word) => word[0] === 'U' ? paid[0].toUpperCase() + paid.slice(1) : paid)
      .replace(/\[Ime primatelja\]|\[Ime donatora\/ice\]/giu, (token) => {
        const id = token.toLowerCase().includes('primatelja') ? 'recipient' : 'donor';
        return value(id) || token;
      });
  }

  function addressRecipient(copy) {
    if (value('address-style') === 'formal') return copy;
    return copy
      .replace(/\bU Vaše ime\b/gu, 'U tvoje ime')
      .replace(/\bVaše ime\b/gu, 'Tvoje ime')
      .replace(/\bVas\b/gu, 'te')
      .replace(/(?<!\p{L})što ste\b/gu, 'što si')
      .replace(/\bNastavite\b/gu, 'Nastavi')
      .replace(/\bSkenirajte\b/gu, 'Skeniraj')
      .replace(/\bdonirajte\b/gu, 'doniraj');
  }

  function fitPreview() {
    if (!dimensions) return;
    const padding = getComputedStyle(stage);
    const availableWidth = stage.clientWidth - parseFloat(padding.paddingLeft) - parseFloat(padding.paddingRight);
    const availableHeight = stage.clientHeight - parseFloat(padding.paddingTop) - parseFloat(padding.paddingBottom);
    const zoom = Math.max(.05, Math.min(availableWidth / dimensions.width, availableHeight / dimensions.height, 1.8));
    frame.style.width = (dimensions.width * zoom) + 'px';
    frame.style.height = (dimensions.height * zoom) + 'px';
    frame.style.setProperty('--zoom', zoom);
  }

  function updateExportButtons() {
    for (const button of exportButtons) button.disabled = pendingExport || !fontsReady || !qrReady || storyTooLong || qrCopyTooLong;
  }

  function fitStory() {
    const main = find('.cert-main');
    const height = main.clientHeight - parseFloat(getComputedStyle(main).paddingTop);
    story.style.setProperty('--fit', 1);
    if (story.offsetHeight > height) {
      let low = .55;
      let high = 1;
      for (let step = 0; step < 8; step += 1) {
        const midpoint = (low + high) / 2;
        story.style.setProperty('--fit', midpoint);
        if (story.offsetHeight > height) high = midpoint;
        else low = midpoint;
      }
      story.style.setProperty('--fit', low);
    }
    storyTooLong = story.offsetHeight > height + 1;
    card.dataset.overflow = String(storyTooLong || qrCopyTooLong);
    const status = field('export-status');
    if (storyTooLong || qrCopyTooLong) {
      status.dataset.fitError = '';
      status.dataset.error = '';
      status.textContent = qrCopyTooLong
        ? 'Skratite tekst uz QR kod kako bi stao na potvrdu.'
        : 'Tekst je predug za odabrani raspored. Skratite ga za izvoz.';
    } else if ('fitError' in status.dataset) {
      delete status.dataset.fitError;
      delete status.dataset.error;
      status.textContent = '';
    }
    updateExportButtons();
  }

  function fitCard() {
    const block = find('.cert-qr');
    const copy = find('.cert-qr-copy');
    const foot = find('.cert-foot');
    const landscape = card.classList.contains('landscape');
    const art = find('.cert-art.right');
    const minimumTop = landscape && !art.hidden
      ? art.offsetTop + art.offsetHeight + card.clientHeight * .025
      : card.clientHeight * (landscape ? .06 : .58);
    copy.style.fontSize = '100%';
    let fit = 1;
    while (!block.hidden && foot.offsetTop < minimumTop && fit > .6) {
      fit = Math.max(.6, fit - .05);
      copy.style.fontSize = (fit * 100) + '%';
    }
    qrCopyTooLong = !block.hidden && foot.offsetTop < minimumTop;
    fitStory();
  }

  function displayImage(image, src) {
    if (image.getAttribute('src') !== src) image.setAttribute('src', src);
  }

  function sizeImage(image, fraction = 1) {
    if (!image.naturalWidth || !image.naturalHeight) return;
    const width = image.parentElement.clientWidth * fraction;
    const height = image.parentElement.clientHeight * fraction;
    const zoom = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    image.style.width = (image.naturalWidth * zoom) + 'px';
    image.style.height = (image.naturalHeight * zoom) + 'px';
  }

  function setQr(src, message = '', isUploaded = false) {
    find('.cert-qr').hidden = !src;
    qrImage.classList.toggle('uploaded', isUploaded);
    if (src) {
      displayImage(qrImage, src);
      sizeImage(qrImage, isUploaded ? .84 : 1);
    }
    setText(field('qr-error'), message);
    qrReady = Boolean(src) || value('qr-mode') === 'none';
    fitCard();
  }

  function qrSvg(QRCode, address) {
    const renderer = new QRCode(document.createElement('div'), { text: address, width: 256, height: 256, correctLevel: QRCode.CorrectLevel.M });
    // qrcodejs includes no quiet zone. Draw its encoded matrix with a four-module white margin.
    const matrix = renderer._oQRCode.modules;
    const size = matrix.length + 8;
    const path = matrix.map((row, y) => row.map((dark, x) => dark ? 'M' + (x + 4) + ' ' + (y + 4) + 'h1v1h-1z' : '').join('')).join('');
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size * 10 + '" height="' + size * 10 + '" viewBox="0 0 ' + size + ' ' + size + '" shape-rendering="crispEdges"><path fill="#fff" d="M0 0h' + size + 'v' + size + 'H0z"/><path fill="#000" d="' + path + '"/></svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  async function updateQr() {
    const mode = value('qr-mode');
    field('qr-url-field').hidden = mode !== 'url';
    field('qr-file-field').hidden = mode !== 'file';
    field('qr-copy-fields').hidden = mode === 'none';

    const key = mode === 'url' ? 'url:' + value('qr-url') : mode === 'file' ? 'file:' + uploadRevision + ':' + qrUploadMessage : 'none';
    if (currentQrKey === key) return;
    currentQrKey = key;
    const revision = ++qrRevision;
    field('qr-url').removeAttribute('aria-invalid');

    if (mode === 'none') {
      setQr('');
      return;
    }
    if (mode === 'file') {
      setQr(uploadedQr, qrUploadMessage || (uploadedQr ? '' : 'Učitajte sliku QR koda.'), true);
      return;
    }

    let address;
    try {
      address = new URL(value('qr-url'));
      if (!['https:', 'http:'].includes(address.protocol) || !address.hostname) throw new Error('Invalid protocol');
    } catch {
      field('qr-url').setAttribute('aria-invalid', 'true');
      setQr('', 'Unesite valjanu poveznicu koja počinje s https:// ili http://.');
      return;
    }

    setQr('');
    try {
      const QRCode = await loadLibrary('qr');
      if (revision === qrRevision) setQr(qrSvg(QRCode, address.href));
    } catch (error) {
      console.error(error);
      if (revision === qrRevision) {
        setQr('', 'QR kod se nije mogao izraditi. Pokušajte s kraćom poveznicom.');
      }
    }
  }

  function render() {
    const format = value('format');
    const landscape = find('[name="orientation"]:checked').value === 'landscape';
    const [shortSide, longSide] = formats[format];
    const [widthMm, heightMm] = landscape ? [longSide, shortSide] : [shortSide, longSide];
    dimensions = { widthMm, heightMm, width: widthMm * 3, height: heightMm * 3 };
    card.style.width = dimensions.width + 'px';
    card.style.height = dimensions.height + 'px';
    card.style.setProperty('--unit', shortSide * .03 + 'px');

    const art = decorations[value('decoration')];
    card.className = ['certificate', value('template'), landscape ? 'landscape' : '', art ? '' : 'plain'].join(' ');
    for (const [index, side] of ['left', 'right'].entries()) {
      const image = find('.cert-art.' + side);
      image.hidden = !art;
      if (art) displayImage(image, 'assets/' + art[index] + '.svg');
    }

    for (const id of ['kicker', 'title', 'greeting', 'signature']) setText(find('.cert-' + id), personalize(value(id)));
    const paragraphs = value('message').split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
    const message = find('.cert-message');
    message.hidden = !paragraphs.length;
    message.replaceChildren(...paragraphs.map((line) => {
      const p = document.createElement('p');
      p.textContent = personalize(line);
      return p;
    }));

    const showAmount = field('show-amount').checked;
    field('amount-field').hidden = !showAmount;
    const amount = value('amount');
    setText(find('.cert-amount'), showAmount && amount ? 'Iznos darovane donacije: ' + amount : '');
    setText(find('.cert-qr-copy h3'), addressRecipient(value('qr-title')));
    setText(find('.cert-qr-copy p'), addressRecipient(value('qr-caption')));

    const label = field('format').selectedOptions[0].textContent.split(' (')[0];
    field('preview-spec').textContent = label + ' · ' + (landscape ? 'Položeno' : 'Uspravno');
    field('print-size').textContent = widthMm + ' × ' + heightMm + ' mm · 305 dpi';
    fitPreview();
    void updateQr();
    sizeImage(logo);
    sizeImage(qrImage, qrImage.classList.contains('uploaded') ? .84 : 1);
    fitCard();
  }

  async function readImage(file, allowed) {
    if (file.size > 8 * 1024 * 1024) throw new Error('Slika može imati najviše 8 MB.');
    const types = { png: 'image/png', svg: 'image/svg+xml', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
    const extension = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(extension)) throw new Error('Odaberite sliku u podržanom formatu.');
    const src = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Datoteka se nije mogla učitati.'));
      reader.readAsDataURL(new Blob([file], { type: types[extension] }));
    });
    const image = new Image();
    image.src = src;
    try { await image.decode(); } catch { throw new Error('Datoteka nije valjana slika.'); }
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('Slika mora imati valjane dimenzije.');
    return src;
  }

  async function uploadQr() {
    const revision = ++uploadRevision;
    const file = field('qr-file').files[0];
    uploadedQr = '';
    qrUploadMessage = file ? 'Učitavanje slike QR koda…' : '';
    void updateQr();
    if (!file) return;
    try {
      const src = await readImage(file, ['png', 'svg', 'jpg', 'jpeg', 'webp']);
      if (revision !== uploadRevision) return;
      uploadedQr = src;
      qrUploadMessage = '';
    } catch (error) {
      if (revision !== uploadRevision) return;
      field('qr-file').value = '';
      qrUploadMessage = error.message;
    }
    void updateQr();
  }

  function resetLogo() {
    logoRevision += 1;
    field('logo-file').value = '';
    field('reset-logo').hidden = true;
    setText(field('logo-error'), '');
    logo.alt = defaultLogoAlt;
    logo.parentElement.classList.remove('custom');
    displayImage(logo, defaultLogo);
    fitCard();
  }

  async function uploadLogo() {
    const revision = ++logoRevision;
    const file = field('logo-file').files[0];
    if (!file) return;
    try {
      const src = await readImage(file, ['png', 'svg']);
      if (revision !== logoRevision) return;
      logo.alt = 'Vlastiti logotip';
      logo.parentElement.classList.add('custom');
      displayImage(logo, src);
      field('reset-logo').hidden = false;
      setText(field('logo-error'), '');
      fitCard();
    } catch (error) {
      if (revision !== logoRevision) return;
      resetLogo();
      setText(field('logo-error'), error.message);
    }
  }

  function pngWithPrintDensity(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        try {
          if (!blob) throw new Error('PNG encoding failed');
          const png = await blob.arrayBuffer();
          const original = new DataView(png);
          const chunk = new Uint8Array(21);
          const density = new DataView(chunk.buffer);
          density.setUint32(0, 9);
          chunk.set([112, 72, 89, 115], 4); // pHYs: pixels per metre on both axes.
          density.setUint32(8, 12000);
          density.setUint32(12, 12000);
          chunk[16] = 1;
          let checksum = 0xffffffff;
          for (const byte of chunk.subarray(4, 17)) {
            checksum ^= byte;
            for (let bit = 0; bit < 8; bit += 1) {
              checksum = (checksum >>> 1) ^ ((checksum & 1) ? 0xedb88320 : 0);
            }
          }
          density.setUint32(17, checksum ^ 0xffffffff);
          const parts = [png.slice(0, 33), chunk];
          let offset = 33;
          while (offset + 12 <= original.byteLength) {
            const next = offset + 12 + original.getUint32(offset);
            if (original.getUint32(offset + 4) !== 0x70485973) parts.push(png.slice(offset, next));
            offset = next;
          }
          resolve(new Blob(parts, { type: 'image/png' }));
        } catch (error) { reject(error); }
      }, 'image/png');
    });
  }

  function saveBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function fileName(kind) {
    const recipient = value('recipient').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[đĐ]/gu, (char) => char === 'đ' ? 'd' : 'D')
      .replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '').slice(0, 65);
    return 'UNICEF_Bozicna_Potvrda_' + (recipient ? recipient + '_' : '') + value('format') + '.' + kind;
  }

  async function exportCertificate(kind) {
    if (pendingExport || !fontsReady || !qrReady || storyTooLong || qrCopyTooLong) return;
    const status = field('export-status');
    pendingExport = true;
    updateExportButtons();
    delete status.dataset.error;
    status.textContent = 'Priprema ' + kind.toUpperCase() + ' datoteke…';
    const { width, height, widthMm, heightMm } = dimensions;
    const name = fileName(kind);
    const snapshot = card.cloneNode(true);
    snapshot.classList.add('export-snapshot');
    snapshot.setAttribute('aria-hidden', 'true');
    document.body.append(snapshot);

    try {
      const [capture, PDF] = await Promise.all([
        loadLibrary('canvas'),
        kind === 'pdf' ? loadLibrary('pdf') : null,
        document.fonts.ready,
        ...[...snapshot.querySelectorAll('img[src]:not([hidden])')]
          .filter((image) => !image.closest('[hidden]')).map((image) => image.decode())
      ]);
      sizeImage(snapshot.querySelector('.cert-logo img'));
      const exportQr = snapshot.querySelector('.qr-paper img');
      sizeImage(exportQr, exportQr.classList.contains('uploaded') ? .84 : 1);
      const canvas = await capture(snapshot, {
        width, height, scale: 4, backgroundColor: '#009FE3',
        useCORS: true, logging: false, scrollX: 0, scrollY: 0
      });
      const png = await pngWithPrintDensity(canvas);
      if (kind === 'png') {
        saveBlob(png, name);
      } else {
        const pdf = new PDF({
          orientation: widthMm > heightMm ? 'landscape' : 'portrait',
          unit: 'mm', format: [widthMm, heightMm], compress: true, precision: 5
        });
        pdf.addImage(new Uint8Array(await png.arrayBuffer()), 'PNG', 0, 0, widthMm, heightMm, undefined, 'FAST');
        saveBlob(pdf.output('blob'), name);
      }
      if (!storyTooLong && !qrCopyTooLong) status.textContent = 'Datoteka je preuzeta.';
    } catch (error) {
      console.error(error);
      status.dataset.error = '';
      status.textContent = 'Izvoz trenutno nije uspio. Pokušajte ponovno.';
    } finally {
      snapshot.remove();
      pendingExport = false;
      updateExportButtons();
    }
  }

  const controls = find('.controls');
  controls.addEventListener('submit', (event) => event.preventDefault());
  controls.addEventListener('input', (event) => {
    const target = event.target;
    if (target.type === 'file' || target.tagName === 'SELECT' || target.type === 'radio') return;
    if (target.hasAttribute('data-copy')) {
      drafts[value('template')] = Object.fromEntries(copyFields.map((input) => [input.id, input.value]));
    }
    render();
  });
  controls.addEventListener('change', (event) => {
    const target = event.target;
    if (target.id === 'qr-file') { void uploadQr(); return; }
    if (target.id === 'logo-file') { void uploadLogo(); return; }
    if (target.id === 'template') loadTemplate();
    if (target.tagName === 'SELECT' || target.type === 'radio') render();
  });
  field('reset-copy').addEventListener('click', () => { loadTemplate(true); render(); });
  field('reset-logo').addEventListener('click', resetLogo);
  logo.addEventListener('load', () => sizeImage(logo));
  qrImage.addEventListener('load', () => sizeImage(qrImage, qrImage.classList.contains('uploaded') ? .84 : 1));
  find('.cert-art.right').addEventListener('load', fitCard);
  for (const button of exportButtons) button.addEventListener('click', () => void exportCertificate(button.dataset.export));

  new ResizeObserver(fitPreview).observe(stage);
  loadTemplate();
  render();
  document.fonts.ready.then(() => {
    fontsReady = true;
    fitCard();
  });
})();
