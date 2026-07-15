/* =========================================================
   Окно оплаты — переиспользуемый модуль.

   Раньше товар был зашит в HTML намертво ("Нежный флирт", 2800 ₽),
   поэтому окно можно было открыть только одной хардкодной кнопкой
   с id="openCheckout" — на catalog.html и index.html такой кнопки
   нет, там свои "Заказать", и клик по ним ничего не открывал.

   Теперь окно слушает КЛИК НА ВСЁМ ДОКУМЕНТЕ и открывается для
   любого элемента с data-checkout-name (см. catalog.js) — конкретный
   товар просто передаётся через data-атрибуты кнопки, по которой
   кликнули, и подставляется в сводку заказа.
   ========================================================= */

const DELIVERY_FEE = 300;

const state = {
  fulfillment: 'delivery',
  payment: 'card',
  product: { name: 'Букет', price: 0, desc: '', img: '' },
};

const overlay        = document.getElementById('checkoutOverlay');

// если на странице нет разметки окна оплаты — модуль тихо ничего не делает
if (overlay) {

  const demoPage        = document.getElementById('demoPage'); // есть только в демо-файле
  const closeBtn        = document.getElementById('checkoutClose');
  const doneBtn         = document.getElementById('checkoutDone');
  const bodyEl          = document.getElementById('checkoutBody');
  const foot            = document.getElementById('checkoutFoot');
  const success         = document.getElementById('checkoutSuccess');

  const deliveryFields  = document.getElementById('deliveryFields');
  const pickupInfo      = document.getElementById('pickupInfo');
  const cashSegmentBtn  = document.getElementById('cashSegmentBtn');
  const deliveryFeeLabel= document.getElementById('deliveryFeeLabel');
  const deliveryFeeValue= document.getElementById('deliveryFeeValue');
  const itemPriceValue  = document.getElementById('itemPriceValue');
  const totalValue      = document.getElementById('totalValue');
  const cta             = document.getElementById('checkoutCta');
  const trust           = document.getElementById('checkoutTrust');
  const streetField     = document.getElementById('streetField');
  const streetInput     = document.getElementById('streetInput');
  const phoneInput      = document.getElementById('phoneInput');
  const successText     = document.getElementById('successText');

  const summaryName  = document.getElementById('checkoutSummaryName');
  const summaryDesc  = document.getElementById('checkoutSummaryDesc');
  const summaryPrice = document.getElementById('checkoutSummaryPrice');
  const summaryImg   = document.getElementById('checkoutSummaryImg');

  /* лёгкий скрэмбл-эффект на цифрах — тот же приём, что и в main.js
     основного сайта (scrambleText для цены/подписи в каруселях),
     только упрощён и ограничен цифрами + рублём, чтобы не переусложнять */
  const SCRAMBLE_DIGITS = '0123456789';
  function scrambleNumber(el, newText){
    if (!el) return;
    clearInterval(el._t);
    const len = newText.length;
    let frame = 0;
    const totalFrames = 9;
    el._t = setInterval(() => {
      frame++;
      let out = '';
      for (let i = 0; i < len; i++){
        const ch = newText[i];
        if (!/[0-9]/.test(ch) || frame >= (i / len) * totalFrames + 3) out += ch;
        else out += SCRAMBLE_DIGITS[(Math.random() * 10) | 0];
      }
      el.textContent = out;
      if (frame >= totalFrames + 3){
        clearInterval(el._t);
        el.textContent = newText;
      }
    }, 26);
  }

  function formatRub(n){ return n.toLocaleString('ru-RU') + ' ₽'; }

  function currentDeliveryFee(){
    return state.fulfillment === 'pickup' ? 0 : DELIVERY_FEE;
  }

  function recalc(){
    const fee = currentDeliveryFee();
    const total = state.product.price + fee;

    if (itemPriceValue) itemPriceValue.textContent = formatRub(state.product.price);
    deliveryFeeLabel.textContent = state.fulfillment === 'pickup' ? 'Самовывоз' : 'Доставка';
    scrambleNumber(deliveryFeeValue, fee === 0 ? 'Бесплатно' : formatRub(fee));
    scrambleNumber(totalValue, formatRub(total));

    const ctaLabel = state.payment === 'card'
      ? `Оплатить ${formatRub(total)} →`
      : `Подтвердить заказ · ${formatRub(total)} →`;
    cta.textContent = ctaLabel;

    trust.textContent = state.payment === 'card'
      ? 'Оплата картой защищена. Нажимая «Оплатить», вы соглашаетесь с условиями доставки.'
      : `Оплата ${state.fulfillment === 'pickup' ? 'на месте' : 'курьеру'} наличными или картой при получении.`;
  }

  /* ---- переключатели способа получения / оплаты / времени ---- */
  document.querySelectorAll('.checkout-segment').forEach(segment => {
    const group = segment.dataset.group;
    segment.querySelectorAll('.checkout-segment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        segment.querySelectorAll('.checkout-segment-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        if (group === 'fulfillment'){
          state.fulfillment = btn.dataset.value;
          applyFulfillment();
        }
        if (group === 'payment'){
          state.payment = btn.dataset.value;
        }
        recalc();
      });
    });
  });

  /* самовывоз убирает строчки адреса и переименовывает "наличными курьеру"
     в "наличными на месте" */
  function applyFulfillment(){
    const isPickup = state.fulfillment === 'pickup';

    deliveryFields.classList.toggle('is-collapsed', isPickup);
    pickupInfo.hidden = !isPickup;

    cashSegmentBtn.textContent = isPickup ? 'Наличными на месте' : 'Наличными курьеру';

    // поле "улица, дом" обязательно только для доставки
    streetInput.required = !isPickup;
    streetField.classList.remove('has-error');
  }

  /* ---- заполнить сводку заказа конкретным товаром ---- */
  function fillSummary(product){
    if (summaryName)  summaryName.textContent  = product.name;
    if (summaryDesc)  summaryDesc.textContent  = product.desc || '1 шт.';
    if (summaryPrice) summaryPrice.textContent = formatRub(product.price);
    if (summaryImg && product.img){
      summaryImg.src = product.img;
      summaryImg.alt = product.name;
    }
  }

  /* ---- открыть / закрыть окно ---- */
  function openCheckout(product){
    state.product = product;
    fillSummary(product);

    // сброс к дефолтному состоянию при каждом новом открытии
    state.fulfillment = 'delivery';
    state.payment = 'card';
    document.querySelectorAll('.checkout-segment').forEach(segment => {
      segment.querySelectorAll('.checkout-segment-btn').forEach((b, i) => b.classList.toggle('is-active', i === 0));
    });
    applyFulfillment();

    overlay.classList.add('is-open');
    if (demoPage) demoPage.classList.add('is-dimmed');
    document.body.style.overflow = 'hidden';
    recalc();
  }

  function closeCheckout(){
    overlay.classList.remove('is-open');
    if (demoPage) demoPage.classList.remove('is-dimmed');
    document.body.style.overflow = '';
    setTimeout(() => {
      bodyEl.style.display = '';
      foot.style.display = '';
      success.classList.remove('is-visible');
    }, 300);
  }

  closeBtn.addEventListener('click', closeCheckout);
  doneBtn.addEventListener('click', closeCheckout);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeCheckout(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeCheckout();
  });

  /* ---- любая кнопка "Заказать" на странице открывает окно ----
     main.js / catalog.js помечают такие кнопки атрибутом
     data-checkout-name (см. catalog.js render()) вместо обычной
     ссылки на index.html#contacts, которая никак не была связана
     с этим окном. */
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-checkout-name]');
    if (!trigger) return;
    e.preventDefault();
    openCheckout({
      name:  trigger.dataset.checkoutName,
      price: Number(trigger.dataset.checkoutPrice) || 0,
      desc:  trigger.dataset.checkoutDesc || '',
      img:   trigger.dataset.checkoutImg || '',
    });
  });

  /* ---- отправка заказа: простая валидация + экран успеха ---- */
  cta.addEventListener('click', () => {
    let valid = true;

    if (state.fulfillment === 'delivery' && !streetInput.value.trim()){
      streetField.classList.add('has-error');
      valid = false;
    } else {
      streetField.classList.remove('has-error');
    }
    if (!phoneInput.value.trim()){
      phoneInput.style.borderColor = 'var(--poppy)';
      valid = false;
    } else {
      phoneInput.style.borderColor = '';
    }
    if (!valid) return;

    const orderNum = '#' + Math.floor(1000 + Math.random() * 9000);
    const isPickup = state.fulfillment === 'pickup';

    successText.innerHTML = isPickup
      ? `Ждём вас на ул. Бривибас, 12. Номер заказа — <span class="checkout-success-num">${orderNum}</span>`
      : `Курьер выедет в течение 60 минут. Номер заказа — <span class="checkout-success-num">${orderNum}</span>`;

    bodyEl.style.display = 'none';
    foot.style.display = 'none';
    success.classList.add('is-visible');
  });

  // экспортируем на случай, если понадобится открыть окно программно
  // (например, из main.js по клику на карточке карусели на главной)
  window.openCheckout = openCheckout;
}