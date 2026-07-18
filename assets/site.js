/* ════════════════════════════════════════════════════════════════
   site.js — общие интерактивные компоненты для всех страниц
     • Mobile menu (выезжающая панель)
     • Sticky-bar — кнопка «Расчёт» открывает форму или ведёт на /contacts
     • Корзина-заявка (LocalStorage)
     • Кастомный курсор в hero
     • Метрика-плейсхолдер (см. блок METRIKA в самом низу)
   ════════════════════════════════════════════════════════════════ */

(() => {
  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

  /* ─── MOBILE MENU ─── */
  function initMobileMenu(){
    const burger = $('.burger');
    const menu   = $('.mobile-menu');
    if (!burger || !menu) return;

    const close = () => menu.classList.remove('open');
    const open  = () => menu.classList.add('open');

    burger.addEventListener('click', open);
    $('.mobile-menu-close', menu)?.addEventListener('click', close);
    // клик по ссылке — закрыть меню
    $$('.mobile-menu-list a', menu).forEach(a => a.addEventListener('click', close));
    // Esc — закрыть
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* ─── CART (LocalStorage) ─── */
  const CART_KEY = 'sm_cart_v1';
  const ATTR_KEY = 'sm_attribution_v1';
  const ATTR_PARAMS = ['yclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  let memoryAttribution = {};

  function captureAttribution(){
    const params = new URLSearchParams(location.search);
    let stored = {};
    try { stored = JSON.parse(sessionStorage.getItem(ATTR_KEY) || '{}'); } catch {}
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) stored = {};

    const hasAdParams = ATTR_PARAMS.some(key => params.get(key));
    if (hasAdParams || !stored.landingPage) {
      const next = hasAdParams ? {} : stored;
      ATTR_PARAMS.forEach(key => {
        const value = (params.get(key) || '').trim();
        if (value) next[key] = value.slice(0, 300);
      });
      next.landingPage = location.href.slice(0, 600);
      next.referrer = (document.referrer || '').slice(0, 600);
      next.capturedAt = new Date().toISOString();
      stored = next;
      try { sessionStorage.setItem(ATTR_KEY, JSON.stringify(stored)); } catch {}
    }
    memoryAttribution = stored;
  }

  function attributionPayload(){
    return ATTR_PARAMS.concat(['landingPage', 'referrer', 'capturedAt']).reduce((out, key) => {
      if (memoryAttribution[key]) out[key] = memoryAttribution[key];
      return out;
    }, {});
  }

  captureAttribution();
  window.SMAttribution = { get: attributionPayload };

  const cart = {
    items: [],
    load(){
      try { this.items = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
      catch { this.items = []; }
    },
    save(){
      try { localStorage.setItem(CART_KEY, JSON.stringify(this.items)); } catch {}
    },
    add(item){
      // та же позиция (по name) — увеличиваем количество, иначе добавляем
      const ex = this.items.find(i => i.name === item.name);
      if (ex) { ex.qty = (ex.qty || 1) + 1; this.save(); this.render(); return true; }
      item.qty = 1;
      this.items.push(item);
      this.save();
      this.render();
      return true;
    },
    remove(name){
      this.items = this.items.filter(i => i.name !== name);
      this.save();
      this.render();
    },
    setQty(name, qty){
      const it = this.items.find(i => i.name === name);
      if (!it) return;
      it.qty = Math.max(1, qty | 0);
      this.save();
      this.render();
    },
    count(){ return this.items.reduce((s, i) => s + (i.qty || 1), 0); },
    sum(){
      return this.items.reduce((s, i) => s + (Number(i.price) || 0) * (i.qty || 1), 0);
    },
    render(){
      // badge на FAB и на sticky-bar
      const c = this.count();
      $$('.cart-fab .badge, .cart-counter').forEach(b => {
        b.textContent = c;
        b.style.display = c > 0 ? 'grid' : 'none';
      });
      const fab = $('.cart-fab');
      if (fab) fab.classList.toggle('visible', c > 0);

      // содержимое модала
      const body = $('.cart-body');
      if (!body) return;
      if (c === 0) {
        closeCheckout();
        body.innerHTML = `
          <div class="cart-empty">
            <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg></div>
            Заявка пуста.<br/>Добавляйте позиции из каталога — отправим менеджеру одной кнопкой.
          </div>`;
        $('.cart-summary b').textContent = '0 ₽';
        return;
      }
      body.innerHTML = this.items.map(it => {
        const colorChip = (it.color || it.colorName)
          ? `<div class="cart-item-color"><span class="cart-item-color-label">Цвет:</span> ${it.color ? 'RAL&nbsp;' + escapeHtml(it.color) + (it.colorName ? ' · ' + escapeHtml(it.colorName) : '') : escapeHtml(it.colorName)}</div>`
          : '';
        const qty = it.qty || 1;
        const hasPrice = !(it.custom || it.price == null);
        const priceLine = hasPrice
          ? formatPrice(it.price) + ' ₽ / ' + escapeHtml(it.unit || 'шт') + (qty > 1 ? ` · <b>${formatPrice(it.price * qty)} ₽</b> <span class="cart-price-for">за</span> ${qty}` : '')
          : 'Цена по запросу';
        return `
        <div class="cart-item">
          <div class="cart-item-info">
            <div class="cart-item-name">${escapeHtml(it.name)}</div>
            <div class="cart-item-meta">${escapeHtml(it.meta || '')}</div>
            ${colorChip}
            <div class="cart-item-price">${priceLine}</div>
          </div>
          <div class="cart-item-ctrl">
            <button class="cart-item-remove" data-remove="${escapeAttr(it.name)}" aria-label="Удалить">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
            <div class="cart-qty">
              <button class="cart-qty-btn" data-qty-dec="${escapeAttr(it.name)}" aria-label="Меньше" ${qty <= 1 ? 'disabled' : ''}>−</button>
              <span class="cart-qty-n">${qty}</span>
              <button class="cart-qty-btn" data-qty-inc="${escapeAttr(it.name)}" aria-label="Больше">+</button>
            </div>
          </div>
        </div>`;
      }).join('');
      $('.cart-summary b').textContent = formatPrice(this.sum()) + ' ₽';
      $$('button[data-remove]', body).forEach(b =>
        b.addEventListener('click', () => this.remove(b.dataset.remove))
      );
      $$('button[data-qty-inc]', body).forEach(b =>
        b.addEventListener('click', () => this.setQty(b.dataset.qtyInc, (this.items.find(i => i.name === b.dataset.qtyInc)?.qty || 1) + 1))
      );
      $$('button[data-qty-dec]', body).forEach(b =>
        b.addEventListener('click', () => this.setQty(b.dataset.qtyDec, (this.items.find(i => i.name === b.dataset.qtyDec)?.qty || 1) - 1))
      );
    },
    async sendToManager(){
      if (this.count() === 0) { toast('Заявка пуста — добавьте позиции из каталога'); return; }
      if (!$('.cart-panel')?.classList.contains('checkout-open')) { openCheckout(); return; }
      const name = ($('.cart-name')?.value || '').trim();
      const contactCheck = validateCartContact();
      const comment = ($('.cart-comment')?.value || '').trim();
      const msg = $('.cart-msg.active')?.dataset.msg || 'whatsapp';
      const msgNames = { whatsapp:'WhatsApp', telegram:'Telegram', max:'MAX' };
      if (!contactCheck.ok) { toast(contactCheck.msg); contactCheck.input?.focus(); return; }
      const contact = contactCheck.value;
      const order = this.items.map((i, idx) => {
        const qty = i.qty || 1;
        const colorLine = i.color ? `\n   Цвет RAL ${i.color}${i.colorName ? ' (' + i.colorName + ')' : ''}` : (i.colorName ? `\n   Цвет: ${i.colorName}` : '');
        const priceLine = (i.custom || i.price == null) ? 'цена по запросу' : `${formatPrice(i.price)} ₽ / ${i.unit || 'шт'}`;
        const qtyLine = `\n   Количество: ${qty} ${i.unit || 'шт'}` + (i.custom || i.price == null ? '' : ` = ${formatPrice(i.price * qty)} ₽`);
        return `${idx+1}. ${i.name} — ${priceLine}\n   ${i.meta || ''}${colorLine}${qtyLine}`;
      }).join('\n\n') +
        (comment ? `\n\nКомментарий: ${comment}` : '');
      const btn = $('.cart-send');
      const originalText = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Отправляем...'; }
      try {
        const res = await fetch('send-lead.php', {
          method: 'POST',
          headers: {'Content-Type':'application/json','Accept':'application/json'},
          body: JSON.stringify({
            kind: 'cart',
            source: 'Корзина сайта',
            name: name || 'Не указано',
            phone: contactCheck.mode === 'Телефон' ? contact : '',
            contact,
            contactType: contactCheck.mode,
            messenger: msgNames[msg] || msg,
            message: order,
            total: this.sum(),
            items: this.items,
            page: location.href,
            attribution: attributionPayload(),
            website: ''
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'send_failed');
        toast('Заявка отправлена. Менеджер свяжется с вами');
        this.items = []; this.save(); this.render();
        $('.cart-name') && ($('.cart-name').value = '');
        $$('.cart-contact').forEach(i => { i.value = ''; });
        $('.cart-comment') && ($('.cart-comment').value = '');
        if (typeof window.SMGoal === 'function') window.SMGoal('cart_send', {messenger: msgNames[msg] || msg});
        if (btn) btn.textContent = '✓ Отправлено';
        setTimeout(() => { if (btn) btn.textContent = 'Оформить заявку'; }, 2200);
      } catch (err) {
        toast('Не получилось отправить заявку. Позвоните или напишите в мессенджер');
        if (btn) btn.textContent = 'Попробовать ещё раз';
      } finally {
        if (btn) btn.disabled = false;
      }
    },
  };

  function initCart(){
    cart.load();
    cart.render();

    $('.cart-fab')?.addEventListener('click', openCart);
    $('.cart-open')?.addEventListener('click', openCart);
    $('.cart-overlay')?.addEventListener('click', closeCart);
    $('.cart-close')?.addEventListener('click', closeCart);
    $('.cart-send')?.addEventListener('click', () => cart.sendToManager());
    $('.cart-clear')?.addEventListener('click', () => { cart.items = []; cart.save(); closeCheckout(); cart.render(); toast('Заявка очищена'); });
    $('.cart-panel')?.classList.add('contact-mode-phone');
    updateCartMessengerMode(false);
    $$('.cart-contact-tab').forEach(b => b.addEventListener('click', () => {
      const mode = b.dataset.contactMode || 'phone';
      if (!isTelegramCartMessenger() && mode === 'username') return;
      setCartContactMode(mode);
      activeCartContactInput()?.focus();
    }));
    // выбор мессенджера для заявки (радио — один активный)
    $$('.cart-msg').forEach(b => b.addEventListener('click', () => {
      $$('.cart-msg').forEach(x => { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('active'); b.setAttribute('aria-pressed', 'true');
      updateCartMessengerMode(true);
    }));

    // глобальная функция чтобы catalog мог добавлять
    window.SMCart = {
      add: (item) => {
        const ok = cart.add(item);
        toast(ok ? '✓ Добавлено в заявку' : '· Уже в заявке');
        if (ok && typeof window.SMGoal === 'function') {
          window.SMGoal('cart_add', {product: item.name || 'Товар'});
        }
        return ok;
      },
      open: openCart,
      get: () => cart.items,
    };
  }
  let cartScrollY = 0;
  function lockPageScroll(){
    if (document.body.classList.contains('cart-lock')) return;
    cartScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.classList.add('cart-lock');
    document.body.classList.add('cart-lock');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${cartScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }
  function unlockPageScroll(){
    if (!document.body.classList.contains('cart-lock')) return;
    document.documentElement.classList.remove('cart-lock');
    document.body.classList.remove('cart-lock');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, cartScrollY);
  }
  function openCheckout(){
    const panel = $('.cart-panel');
    if (!panel) return;
    panel.classList.add('checkout-open');
    updateCartMessengerMode(false);
    const btn = $('.cart-send');
    if (btn) btn.textContent = 'Отправить заявку';
    setTimeout(() => activeCartContactInput()?.focus(), 80);
  }
  function closeCheckout(){
    $('.cart-panel')?.classList.remove('checkout-open');
    const btn = $('.cart-send');
    if (btn && !btn.disabled) btn.textContent = 'Оформить заявку';
  }
  function openCart(){
    lockPageScroll();
    closeCheckout();
    $('.cart-overlay')?.classList.add('open');
    $('.cart-panel')?.classList.add('open');
    if (typeof window.SMGoal === 'function') window.SMGoal('cart_open', {items: cart.count()});
  }
  function closeCart(){
    $('.cart-overlay')?.classList.remove('open');
    $('.cart-panel')?.classList.remove('open');
    closeCheckout();
    unlockPageScroll();
  }

  /* ─── TOAST ─── */
  let toastTimer = 0;
  function toast(text){
    let t = $('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      t.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg><span class="toast-text"></span>`;
      document.body.appendChild(t);
    }
    $('.toast-text', t).textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }
  window.SMToast = toast;

  /* ─── HERO CURSOR ─── */
  function initHeroCursor(){
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    const hero = $('.hero');
    if (!hero) return;
    const cur = document.createElement('div');
    cur.className = 'hero-cursor';
    document.body.appendChild(cur);

    hero.addEventListener('mouseenter', () => cur.classList.add('visible'));
    hero.addEventListener('mouseleave', () => cur.classList.remove('visible'));
    hero.addEventListener('mousemove', (e) => {
      cur.style.left = e.clientX + 'px';
      cur.style.top  = e.clientY + 'px';
    });

    // hover-state на ссылках/кнопках внутри hero
    $$('a, button, .hero-product, .hero-viz', hero).forEach(el => {
      el.addEventListener('mouseenter', () => cur.classList.add('hover'));
      el.addEventListener('mouseleave', () => cur.classList.remove('hover'));
    });
  }

  /* ─── helpers ─── */
  function escapeHtml(s){
    return String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  function escapeAttr(s){ return escapeHtml(s); }
  function formatPrice(n){
    const x = Number(n) || 0;
    return Number.isInteger(x) ? x.toLocaleString('ru-RU') : x.toFixed(2);
  }

  /* ─── SMOOTH FAQ — плавное открытие <details> ─── */
  function initSmoothFAQ(){
    $$('.faq-item').forEach(item => {
      const summary = item.querySelector('summary');
      const answer = item.querySelector('.answer');
      if (!summary || !answer) return;

      // готовим answer к анимации
      answer.style.overflow = 'hidden';
      answer.style.transition = 'max-height .42s cubic-bezier(.22,.61,.36,1), opacity .3s ease';

      // если изначально open — выставляем рабочий max-height
      if (item.open) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        answer.style.opacity = '1';
      } else {
        answer.style.maxHeight = '0px';
        answer.style.opacity = '0';
      }

      summary.addEventListener('click', (e) => {
        e.preventDefault();
        const opening = !item.open;

        // закрыть остальные открытые (один пункт за раз)
        if (opening) {
          $$('.faq-item[open]').forEach(other => {
            if (other === item) return;
            const a2 = other.querySelector('.answer');
            if (!a2) return;
            a2.style.maxHeight = '0px';
            a2.style.opacity = '0';
            setTimeout(() => other.removeAttribute('open'), 380);
          });
        }

        if (opening) {
          item.setAttribute('open', '');
          // двойной rAF, чтобы DOM применил open и transition сработал
          requestAnimationFrame(() => {
            answer.style.maxHeight = answer.scrollHeight + 'px';
            answer.style.opacity = '1';
          });
        } else {
          answer.style.maxHeight = answer.scrollHeight + 'px';
          requestAnimationFrame(() => {
            answer.style.maxHeight = '0px';
            answer.style.opacity = '0';
          });
          setTimeout(() => item.removeAttribute('open'), 420);
        }
      });

      // если контент внутри answer меняется — обновим высоту
      const ro = new ResizeObserver(() => {
        if (item.open) answer.style.maxHeight = answer.scrollHeight + 'px';
      });
      ro.observe(answer);
    });
  }

  /* ─── COOKIE BANNER ─── */
  const COOKIE_KEY = 'sm_cookie_consent_v1';
  function initCookieBanner(){
    // если уже согласился — не показываем
    try {
      if (localStorage.getItem(COOKIE_KEY) === 'accepted') return;
    } catch {}

    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Уведомление об использовании cookies');
    banner.innerHTML = `
      <div class="cookie-banner-text">
        Используем cookies и Яндекс.Метрику. Аналитика — только после согласия.
        <a href="policy-privacy.html">Подробнее</a>.
      </div>
      <div class="cookie-banner-actions">
        <button type="button" class="cookie-accept">Принять</button>
        <button type="button" class="cookie-decline">Только необходимые</button>
      </div>`;
    document.body.appendChild(banner);
    // плавное появление
    requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('show')));

    function close(){ banner.classList.remove('show'); setTimeout(() => banner.remove(), 600); }

    banner.querySelector('.cookie-accept').addEventListener('click', () => {
      try { localStorage.setItem(COOKIE_KEY, 'accepted'); } catch {}
      if (typeof window.SM_loadMetrika === 'function') window.SM_loadMetrika();
      close();
    });
    banner.querySelector('.cookie-decline').addEventListener('click', () => {
      try { localStorage.setItem(COOKIE_KEY, 'declined'); } catch {}
      // Метрику не загружаем — только технические cookies
      close();
    });
  }

  /* ─── INIT ─── */
  /* ─── МАСКА ТЕЛЕФОНА  +7 (___) ___-__-__ ─── */
  function formatPhone(digits){
    // оставляем максимум 11 цифр, первая всегда 7
    let d = digits.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (d && d[0] !== '7') d = '7' + d; // ввели без кода страны / с 9...
    d = d.slice(0, 11);
    if (d.length <= 1) return d ? '+7' : '';
    // разделители добавляем ТОЛЬКО когда за ними есть цифра — иначе backspace застревает
    let out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length > 4) out += ') ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    return out;
  }
  function isTelegramCartMessenger(){
    return ($('.cart-msg.active')?.dataset.msg || 'whatsapp') === 'telegram';
  }
  function setCartContactMode(mode){
    const next = mode === 'username' && isTelegramCartMessenger() ? 'username' : 'phone';
    $$('.cart-contact-tab').forEach(x => {
      const active = (x.dataset.contactMode || 'phone') === next;
      x.classList.toggle('active', active);
      x.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    const panel = $('.cart-panel');
    panel?.classList.toggle('contact-mode-username', next === 'username');
    panel?.classList.toggle('contact-mode-phone', next !== 'username');
  }
  function updateCartMessengerMode(shouldFocus){
    const telegram = isTelegramCartMessenger();
    const panel = $('.cart-panel');
    panel?.classList.toggle('messenger-telegram', telegram);
    if (!telegram) setCartContactMode('phone');
    if (shouldFocus && panel?.classList.contains('checkout-open')) activeCartContactInput()?.focus();
  }
  function cartContactMode(){
    if (!isTelegramCartMessenger()) return 'phone';
    return $('.cart-contact-tab.active')?.dataset.contactMode || 'phone';
  }
  function activeCartContactInput(){
    return cartContactMode() === 'username' ? $('.cart-contact-username') : $('.cart-contact-phone');
  }
  function normalizeRuPhone(value){
    let d = String(value || '').replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (d && d[0] !== '7') d = '7' + d;
    return d.slice(0, 11);
  }
  function validateCartContact(){
    const mode = cartContactMode();
    const input = activeCartContactInput();
    const raw = (input?.value || '').trim();
    if (mode === 'phone') {
      const digits = normalizeRuPhone(raw);
      if (digits.length !== 11) return { ok:false, msg:'Введите телефон полностью: +7 (___) ___-__-__', input };
      return { ok:true, mode:'Телефон', value:formatPhone(digits) };
    }
    const isProfileLink = /^https?:\/\/(t\.me|telegram\.me|wa\.me|max\.ru)\/[^\s]+$/i.test(raw);
    const isUsername = /^@?[a-zA-Z0-9_.]{3,32}$/.test(raw);
    if (!isProfileLink && !isUsername) return { ok:false, msg:'Введите @username или ссылку на профиль', input };
    return { ok:true, mode:'Username/ссылка', value:isProfileLink ? raw : (raw.startsWith('@') ? raw : '@' + raw) };
  }
  function initLeadForms(){
    $$('form[data-lead-form]').forEach(form => {
      if (form.dataset.leadBound) return;
      form.dataset.leadBound = '1';
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!form.reportValidity()) return;
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn ? btn.textContent : '';
        const payload = {
          source: form.dataset.leadSource || document.title,
          name: form.querySelector('[name="name"], #f-name')?.value || '',
          phone: form.querySelector('[name="phone"], #f-phone')?.value || '',
          message: form.querySelector('[name="message"], #f-msg')?.value || '',
          website: form.querySelector('[name="website"]')?.value || '',
          page: location.href,
          attribution: attributionPayload(),
        };
        if (btn) { btn.disabled = true; btn.textContent = 'Отправляем...'; }
        try {
          const res = await fetch('send-lead.php', {
            method: 'POST',
            headers: {'Content-Type':'application/json','Accept':'application/json'},
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) throw new Error(data.error || 'send_failed');
          toast('Заявка отправлена. Менеджер свяжется с вами');
          form.reset();
          if (btn) btn.textContent = '✓ Заявка отправлена';
          setTimeout(() => { if (btn) btn.textContent = originalText || 'Отправить'; }, 2600);
          if (typeof window.SMGoal === 'function') window.SMGoal('form_submit', {source: payload.source});
        } catch (err) {
          toast('Не получилось отправить заявку. Позвоните или напишите в мессенджер');
          if (btn) btn.textContent = 'Попробовать ещё раз';
        } finally {
          if (btn) btn.disabled = false;
        }
      });
    });
  }

  function initPhoneMask(){
    document.querySelectorAll('input[type="tel"]').forEach(inp => {
      if (inp.dataset.maskBound) return;
      inp.dataset.maskBound = '1';
      inp.setAttribute('inputmode', 'tel');
      inp.setAttribute('maxlength', '18');

      inp.addEventListener('input', (e) => {
        inp.setCustomValidity('');
        const isDelete = e.inputType && e.inputType.indexOf('delete') === 0;
        const digits = inp.value.replace(/\D/g, '');
        // полностью пусто или осталась одна цифра при удалении — очищаем
        if (digits.length === 0 || (isDelete && digits.length <= 1)) { inp.value = ''; return; }
        inp.value = formatPhone(inp.value);
      });
      inp.addEventListener('focus', () => { if (!inp.value) inp.value = '+7 ('; });
      inp.addEventListener('blur',  () => {
        const digits = inp.value.replace(/\D/g, '');
        if (digits.length <= 1) inp.value = '';
      });
      // запрет на отправку неполного номера
      inp.addEventListener('invalid', () => {
        const digits = inp.value.replace(/\D/g, '');
        if (digits.length && digits.length < 11) inp.setCustomValidity('Введите номер полностью: +7 (___) ___-__-__');
        else inp.setCustomValidity('');
      });
    });
  }

  function init(){
    initMobileMenu();
    initCart();
    initHeroCursor();
    initSmoothFAQ();
    initCookieBanner();
    initPhoneMask();
    initLeadForms();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ════════════════════════════════════════════════════════════════
   ЯНДЕКС.МЕТРИКА
   Чтобы подключить — замени COUNTER_ID_PLACEHOLDER на номер
   счётчика из https://metrika.yandex.ru (после регистрации сайта).
   Цели для отслеживания:
     • click_phone        — клик по номеру телефона
     • click_whatsapp     — клик в WhatsApp
     • click_telegram     — клик в Telegram
     • click_max          — клик в MAX
     • click_email        — клик по электронной почте
     • click_calc         — клик в калькулятор
     • calculator_use     — изменение параметров калькулятора
     • cart_add           — добавление в заявку
     • cart_open          — открытие корзины
     • cart_send          — успешная отправка заявки из корзины
     • download_price     — клик «Скачать прайс»
     • form_submit        — отправка формы расчёта
   ════════════════════════════════════════════════════════════════ */
/* ВНИМАНИЕ: при подключении замени значение ниже на свой ID счётчика */
window.SM_METRIKA_ID = window.SM_METRIKA_ID || 'COUNTER_ID_PLACEHOLDER';

/* Метрика загружается ТОЛЬКО после согласия пользователя на cookies (152-ФЗ).
   Скрипт tag.js и трекеры НЕ подгружаются до клика «Принять». */
window.SM_loadMetrika = function(){
  if (!window.SM_METRIKA_ID || window.SM_METRIKA_ID === 'COUNTER_ID_PLACEHOLDER') return;
  if (window.__sm_metrika_loaded) return;
  window.__sm_metrika_loaded = true;
  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
  (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
  if (window.SM_METRIKA_ID && window.SM_METRIKA_ID !== 'COUNTER_ID_PLACEHOLDER') {
    ym(window.SM_METRIKA_ID, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });
  }
};

/* Если пользователь уже дал согласие ранее — грузим Метрику сразу */
try {
  if (localStorage.getItem('sm_cookie_consent_v1') === 'accepted') {
    window.SM_loadMetrika();
  }
} catch {}

/* Хелпер для отправки целей в Метрику */
window.SMGoal = function(name, params){
  if (window.SM_METRIKA_ID && window.SM_METRIKA_ID !== 'COUNTER_ID_PLACEHOLDER') {
    try { ym(window.SM_METRIKA_ID, 'reachGoal', name, params); } catch {}
  }
};

/* Автоматические цели — подвешиваются после загрузки DOM */
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('tel:')) SMGoal('click_phone');
    else if (href.startsWith('mailto:')) SMGoal('click_email');
    else if (/wa\.me/i.test(href)) SMGoal('click_whatsapp');
    else if (/(^|\/)t\.me\//i.test(href)) SMGoal('click_telegram');
    else if (/max\.ru/i.test(href)) SMGoal('click_max');
    if (/calculator\.html/i.test(href)) SMGoal('click_calc');
    if (/\.pdf(?:$|[?#])/i.test(href) || link.hasAttribute('download')) SMGoal('download_price');
  });

  const calculatorGoals = new Set();
  const trackCalculator = event => {
    const panel = event.target.closest('.calc-card[data-panel]');
    if (!panel || calculatorGoals.has(panel.dataset.panel)) return;
    calculatorGoals.add(panel.dataset.panel);
    SMGoal('calculator_use', {type: panel.dataset.panel});
  };
  document.addEventListener('input', trackCalculator);
  document.addEventListener('change', trackCalculator);
});
