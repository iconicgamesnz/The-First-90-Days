(() => {
  "use strict";

  const app = document.getElementById("game-app");
  const screen = document.getElementById("screen");
  const hud = document.getElementById("hud");
  const worldArt = document.getElementById("world-art");
  const effectLayer = document.getElementById("effect-layer");
  const aboutButton = document.getElementById("about-button");
  const aboutDialog = document.getElementById("about-dialog");

  const metricEls = {
    cash: document.getElementById("hud-cash"),
    reputation: document.getElementById("hud-reputation"),
    capacity: document.getElementById("hud-capacity"),
    confidence: document.getElementById("hud-confidence"),
  };

  const initialState = Object.freeze({
    cash: 750,
    reputation: 50,
    capacity: 50,
    confidence: 50,
  });

  let state = { ...initialState };
  let currentDay = 1;
  let cashFlowActions = { followedUp: false, paidSupplier: false };

  const assetPath = (file) => {
    const base = "game-assets/first-90-days-assets/generated-assets/";
    return window.location.protocol === "file:"
      ? `./public/${base}${file}`
      : `/${base}${file}`;
  };

  function clampMetric(value) {
    return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
  }

  function normaliseState() {
    state.cash = Math.round(Number.isFinite(state.cash) ? state.cash : 0);
    state.reputation = clampMetric(state.reputation);
    state.capacity = clampMetric(state.capacity);
    state.confidence = clampMetric(state.confidence);
  }

  function formatCash(value) {
    const rounded = Math.round(Number.isFinite(value) ? value : 0);
    return `${rounded < 0 ? "−" : ""}$${Math.abs(rounded).toLocaleString("en-NZ")}`;
  }

  function updateHud() {
    normaliseState();
    document.getElementById("hud-day").textContent = String(currentDay);
    metricEls.cash.textContent = formatCash(state.cash);
    metricEls.reputation.textContent = String(state.reputation);
    metricEls.capacity.textContent = String(state.capacity);
    metricEls.confidence.textContent = String(state.confidence);
  }

  function showChange(key, amount, delay = 0) {
    if (!amount) return;
    window.setTimeout(() => {
      const node = document.createElement("div");
      node.className = `floating-change ${amount > 0 ? "positive" : "negative"}`;
      const label = key === "cash" ? "Pūtea" : key[0].toUpperCase() + key.slice(1);
      const value = key === "cash"
        ? `${amount > 0 ? "+" : "−"}$${Math.abs(Math.round(amount)).toLocaleString("en-NZ")}`
        : `${amount > 0 ? "+" : ""}${Math.round(amount)}`;
      node.textContent = `${label} ${value}`;
      effectLayer.appendChild(node);
      window.setTimeout(() => node.remove(), 1750);
    }, delay);
  }

  function applyEffects(effects) {
    Object.entries(effects).forEach(([key, amount], index) => {
      state[key] += amount;
      showChange(key, amount, index * 170);
    });
    normaliseState();
    window.setTimeout(updateHud, 180);
  }

  function setWorld(file = "market-hub-reference.png") {
    worldArt.src = assetPath(file);
  }

  function transitionTo(day, renderFn) {
    currentDay = day;
    updateHud();
    screen.innerHTML = `
      <section class="day-transition" aria-label="Day ${day}">
        <div class="day-medallion"><small>DAY</small><strong>${day}</strong></div>
        <p>Your pakihi keeps moving.</p>
      </section>
    `;
    window.setTimeout(renderFn, 780);
  }

  function consequence({ title, text, principle = "", nextDay, nextRender }) {
    screen.innerHTML = `
      <section class="consequence-screen">
        <div class="consequence-panel">
          <span class="panel-kicker">THE BUSINESS REACTS</span>
          <h2>${title}</h2>
          <p>${text}</p>
          ${principle ? `<div class="principle"><small>BUSINESS PRINCIPLE</small><strong>${principle}</strong></div>` : ""}
          <button id="continue-game" class="primary-button compact" type="button">Continue</button>
        </div>
      </section>
    `;
    document.getElementById("continue-game").addEventListener("click", () => transitionTo(nextDay, nextRender), { once: true });
  }

  function renderOpening() {
    state = { ...initialState };
    currentDay = 1;
    cashFlowActions = { followedUp: false, paidSupplier: false };
    hud.classList.add("is-hidden");
    app.classList.remove("is-playing");
    setWorld();
    updateHud();

    screen.innerHTML = `
      <section class="hero-screen">
        <div class="hero-card">
          <span class="panel-kicker">ICONIC GAMES PRESENTS</span>
          <h1>FIRST <em>90 DAYS</em></h1>
          <p class="hero-lead">Build your pakihi. Make the calls. Live with the consequences.</p>
          <div class="opening-stats" aria-label="Starting resources">
            <span><small>STARTING CASH</small><strong>$750</strong></span>
            <span><small>ONE MARKET STALL</small><strong>90 DAYS</strong></span>
          </div>
          <p class="hero-note">There isn't always one right answer. You will run the business, make the calls, and see what changes.</p>
          <button id="start-button" class="primary-button" type="button">Start your pakihi</button>
        </div>
      </section>
    `;

    document.getElementById("start-button").addEventListener("click", () => {
      app.classList.add("is-playing");
      hud.classList.remove("is-hidden");
      transitionTo(1, renderDay1);
    }, { once: true });
  }

  function renderDay1() {
    const setup = {
      stock: false,
      equipment: false,
      signage: false,
    };

    const items = {
      stock: { cost: 120, label: "Starter stock", detail: "Enough product to begin trading", icon: "▣" },
      equipment: { cost: 100, label: "Basic equipment", detail: "The essentials to fulfil orders", icon: "⚙" },
      signage: { cost: 500, label: "Signage + presentation", detail: "A premium first impression", icon: "◆" },
    };

    screen.innerHTML = `
      <section class="sim-screen">
        <div class="scene-heading">
          <span class="panel-kicker">DAY 1 · STARTING OUT</span>
          <h2>Set up your stall</h2>
          <p>You have <strong>$750</strong>. Tap what you want to buy. You can open the stall at any time.</p>
        </div>

        <div class="market-stall" aria-label="Market stall setup">
          <div class="stall-canopy"><span>YOUR PAKIHI</span></div>
          <div class="stall-surface"></div>
          <button class="world-object crate-object" data-item="stock" type="button" aria-pressed="false">
            <span class="object-icon">▣</span>
            <strong>Starter stock</strong>
            <small>$120</small>
          </button>
          <button class="world-object equipment-object" data-item="equipment" type="button" aria-pressed="false">
            <span class="object-icon">⚙</span>
            <strong>Equipment</strong>
            <small>$100</small>
          </button>
          <button class="world-object sign-object" data-item="signage" type="button" aria-pressed="false">
            <span class="object-icon">◆</span>
            <strong>Presentation</strong>
            <small>$500</small>
          </button>
        </div>

        <div class="setup-console">
          <div>
            <small>YOU'RE SPENDING</small>
            <strong id="setup-spend">$0</strong>
          </div>
          <div>
            <small>CASH LEFT</small>
            <strong id="setup-left">$750</strong>
          </div>
          <button id="open-stall" class="primary-button compact" type="button">Open the stall</button>
        </div>
        <p id="setup-feedback" class="live-feedback">Nothing is selected yet. Your cash is safe, but the market is already open.</p>
      </section>
    `;

    const buttons = [...screen.querySelectorAll("[data-item]")];
    const spendEl = document.getElementById("setup-spend");
    const leftEl = document.getElementById("setup-left");
    const feedbackEl = document.getElementById("setup-feedback");

    function refreshSetup() {
      const spend = Object.entries(setup).reduce((sum, [key, selected]) => sum + (selected ? items[key].cost : 0), 0);
      spendEl.textContent = formatCash(spend);
      leftEl.textContent = formatCash(750 - spend);
      if (spend === 0) {
        feedbackEl.textContent = "Nothing is selected yet. Your cash is safe, but the market is already open.";
      } else if (spend > 550) {
        feedbackEl.textContent = "The stall will make a strong first impression, but there will be very little cash buffer left.";
      } else if (setup.stock && setup.equipment && !setup.signage) {
        feedbackEl.textContent = "You have enough to trade and most of your cash is still available.";
      } else {
        feedbackEl.textContent = "Your setup is taking shape. You can keep adjusting it before you open.";
      }
      return spend;
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.item;
        const next = !setup[key];
        const currentSpend = refreshSetup();
        const nextSpend = currentSpend + (next ? items[key].cost : -items[key].cost);
        if (nextSpend > 750) {
          button.classList.add("denied");
          feedbackEl.textContent = "That would take you over your $750 starting cash. Something else has to give.";
          window.setTimeout(() => button.classList.remove("denied"), 520);
          return;
        }
        setup[key] = next;
        button.classList.toggle("selected", next);
        button.setAttribute("aria-pressed", String(next));
        refreshSetup();
      });
    });

    refreshSetup();

    document.getElementById("open-stall").addEventListener("click", () => {
      const spend = refreshSetup();
      const effects = { cash: -spend };

      if (setup.stock) effects.capacity = (effects.capacity || 0) + 3;
      if (setup.equipment) {
        effects.capacity = (effects.capacity || 0) + 2;
        effects.confidence = (effects.confidence || 0) + 4;
      }
      if (setup.signage) {
        effects.reputation = (effects.reputation || 0) + 8;
        effects.confidence = (effects.confidence || 0) + 5;
      }
      if (setup.stock && setup.equipment && !setup.signage) {
        effects.confidence = (effects.confidence || 0) + 3;
      }
      if (spend === 0) {
        effects.confidence = -8;
        effects.reputation = -2;
      }

      applyEffects(effects);

      let text = "You open the stall and finally start learning from real customers.";
      if (spend === 0) text = "Your money is safe, but another trading day passes without stock, sales or customer feedback.";
      else if (setup.signage && state.cash <= 250) text = "The stall looks excellent and people notice it immediately. The trade-off is visible too: your cash buffer is now very thin.";
      else if (setup.stock && setup.equipment && !setup.signage) text = "It isn't flashy, but you can trade. More importantly, you kept enough cash to respond when something unexpected happens.";

      consequence({
        title: "The doors are open",
        text,
        nextDay: 10,
        nextRender: renderDay10,
      });
    }, { once: true });
  }

  function renderDay10() {
    screen.innerHTML = `
      <section class="sim-screen">
        <div class="scene-heading">
          <span class="panel-kicker">DAY 10 · YOUR FIRST BIG CUSTOMER</span>
          <h2>Build the quote</h2>
          <p>A customer loves your work, but asks if you can do the order for <strong>$120 instead of $180</strong>.</p>
        </div>

        <div class="customer-scene">
          <div class="customer-bubble">“Kia ora! Could you do this order for $120? I'll definitely tell everyone about you.”</div>
          <div class="quote-terminal">
            <div class="terminal-header"><span>LIVE QUOTE</span><strong id="quote-total">$150</strong></div>
            <label>Price
              <input id="quote-price" type="range" min="120" max="180" value="150" step="5" />
              <output id="quote-price-output">$150</output>
            </label>
            <label>Order size
              <input id="quote-size" type="range" min="60" max="100" value="75" step="5" />
              <output id="quote-size-output">75%</output>
            </label>
            <div class="quote-readout"><small>YOUR OFFER</small><strong id="quote-summary">$150 · 75% of original order</strong></div>
            <button id="send-quote" class="primary-button compact" type="button">Send quote</button>
          </div>
        </div>
      </section>
    `;

    const price = document.getElementById("quote-price");
    const size = document.getElementById("quote-size");
    const priceOut = document.getElementById("quote-price-output");
    const sizeOut = document.getElementById("quote-size-output");
    const summary = document.getElementById("quote-summary");
    const total = document.getElementById("quote-total");

    function refreshQuote() {
      const p = Number(price.value);
      const s = Number(size.value);
      priceOut.value = `$${p}`;
      sizeOut.value = `${s}%`;
      total.textContent = `$${p}`;
      summary.textContent = `$${p} · ${s}% of original order`;
    }

    price.addEventListener("input", refreshQuote);
    size.addEventListener("input", refreshQuote);
    refreshQuote();

    document.getElementById("send-quote").addEventListener("click", () => {
      const p = Number(price.value);
      const s = Number(size.value);
      let effects;
      let text;
      let principle = "Price and value don't always have to move together.";

      if (p >= 170 && s >= 90) {
        effects = { confidence: 5 };
        text = "You protect the original price and scope. The customer decides not to order today, but you do not discount work you cannot justify discounting.";
      } else if (p <= 130 && s >= 90) {
        effects = { cash: p, reputation: 4, capacity: -6 };
        text = "You make the sale at almost the requested discount. Revenue comes in, but the margin and workload are both tighter than planned.";
      } else {
        effects = { cash: p, reputation: 7, confidence: 5, capacity: s >= 85 ? -5 : -3 };
        text = "You reshape the offer instead of simply saying yes or no. The customer accepts a version that better matches the value and workload.";
      }

      applyEffects(effects);
      consequence({ title: "Quote sent", text, principle, nextDay: 24, nextRender: renderDay24 });
    }, { once: true });
  }

  function renderDay24() {
    screen.innerHTML = `
      <section class="sim-screen">
        <div class="scene-heading">
          <span class="panel-kicker">DAY 24 · CUSTOMER COMPLAINT</span>
          <h2>Resolve the complaint</h2>
          <p>Your phone lights up. The customer is disappointed. A full fix would cost about <strong>$65</strong>.</p>
        </div>

        <div class="phone-scene">
          <div class="phone-frame">
            <div class="phone-top">CUSTOMER MESSAGE</div>
            <div class="message-bubble">Kia ora. My order wasn't what I expected. I'm pretty disappointed.</div>
            <div class="resolution-builder">
              <label>Refund / replacement value
                <input id="resolution-value" type="range" min="0" max="65" value="35" step="5" />
                <output id="resolution-output">$35</output>
              </label>
              <p id="resolution-preview">You're offering a meaningful compromise without absorbing the entire cost.</p>
              <button id="send-resolution" class="primary-button compact" type="button">Send resolution</button>
            </div>
          </div>
        </div>
      </section>
    `;

    const slider = document.getElementById("resolution-value");
    const output = document.getElementById("resolution-output");
    const preview = document.getElementById("resolution-preview");

    function refreshResolution() {
      const value = Number(slider.value);
      output.value = `$${value}`;
      if (value === 0) preview.textContent = "You're standing by the original order and offering no financial remedy.";
      else if (value >= 55) preview.textContent = "You're taking most of the cost yourself to repair the customer relationship quickly.";
      else preview.textContent = "You're offering a meaningful compromise without absorbing the entire cost.";
    }

    slider.addEventListener("input", refreshResolution);
    refreshResolution();

    document.getElementById("send-resolution").addEventListener("click", () => {
      const value = Number(slider.value);
      let effects;
      let text;
      if (value === 0) {
        effects = { reputation: -10, confidence: 2 };
        text = "You stand by the original transaction. Your cash does not move, but the customer leaves feeling unheard.";
      } else if (value >= 55) {
        effects = { cash: -value, reputation: 12, capacity: -7 };
        text = "The problem costs you money and time, but the customer feels listened to and the relationship recovers strongly.";
      } else {
        effects = { cash: -value, reputation: 6, capacity: -3 };
        text = "You acknowledge the customer's experience and find a compromise that costs less than a full replacement.";
      }
      applyEffects(effects);
      consequence({ title: "Complaint resolved", text, nextDay: 41, nextRender: renderDay41 });
    }, { once: true });
  }

  function renderDay41() {
    screen.innerHTML = `
      <section class="sim-screen">
        <div class="scene-heading">
          <span class="panel-kicker">DAY 41 · SUPPLIER UPDATE</span>
          <h2>Rework the product</h2>
          <p>Your usual stock order now costs <strong>$110 more</strong>. Adjust what customers pay, change the range, or leave things alone.</p>
        </div>

        <div class="supplier-board">
          <div class="invoice-card"><small>SUPPLIER INCREASE</small><strong>+$110</strong><span>next stock order</span></div>
          <div class="pricing-console">
            <label>Customer price increase
              <input id="price-rise" type="range" min="0" max="10" value="0" step="1" />
              <output id="price-rise-output">$0</output>
            </label>
            <label class="range-toggle">
              <input id="change-range" type="checkbox" />
              <span>Redesign part of the product range</span>
            </label>
            <div id="supplier-preview" class="live-feedback">Customers see no change, so your margin takes the full hit.</div>
            <button id="apply-supplier-plan" class="primary-button compact" type="button">Apply changes</button>
          </div>
        </div>
      </section>
    `;

    const priceRise = document.getElementById("price-rise");
    const range = document.getElementById("change-range");
    const out = document.getElementById("price-rise-output");
    const preview = document.getElementById("supplier-preview");

    function refreshSupplier() {
      const rise = Number(priceRise.value);
      out.value = `$${rise}`;
      if (range.checked && rise > 0) preview.textContent = "You're spreading the pressure across price and product instead of relying on one lever.";
      else if (range.checked) preview.textContent = "You're changing the product range rather than passing the full increase straight to customers.";
      else if (rise >= 5) preview.textContent = "You're asking customers to absorb a meaningful share of the higher cost.";
      else if (rise > 0) preview.textContent = "You're recovering only part of the increase through price.";
      else preview.textContent = "Customers see no change, so your margin takes the full hit.";
    }

    priceRise.addEventListener("input", refreshSupplier);
    range.addEventListener("change", refreshSupplier);
    refreshSupplier();

    document.getElementById("apply-supplier-plan").addEventListener("click", () => {
      const rise = Number(priceRise.value);
      const changedRange = range.checked;
      let effects = {};
      let text;

      if (changedRange) {
        effects.cash = -35 + Math.round(rise * 9);
        effects.capacity = -3;
        effects.confidence = 6;
        effects.reputation = rise >= 7 ? -2 : 1;
        text = rise > 0
          ? "You change the range and make a smaller price adjustment. The business shares the pressure across product and price."
          : "You redesign part of what you sell instead of simply accepting the higher input cost.";
      } else if (rise >= 5) {
        effects.cash = 80;
        effects.reputation = -4;
        effects.confidence = 4;
        text = "The price rise protects more of your margin. Some customers notice immediately.";
      } else if (rise > 0) {
        effects.cash = -55;
        effects.reputation = -1;
        effects.confidence = 2;
        text = "You recover part of the increase through price, but the business still absorbs some of the pressure.";
      } else {
        effects.cash = -110;
        effects.reputation = 3;
        text = "Customers see no change. Your relationship stays steady, but the tighter margin is now your problem to manage.";
      }

      applyEffects(effects);
      consequence({
        title: "New pricing is live",
        text,
        principle: "When costs change, businesses can change price, product, process—or all three.",
        nextDay: 63,
        nextRender: renderDay63,
      });
    }, { once: true });
  }

  function renderDay63() {
    screen.innerHTML = `
      <section class="sim-screen">
        <div class="scene-heading">
          <span class="panel-kicker">DAY 63 · BIG OPPORTUNITY</span>
          <h2>How much can you actually deliver?</h2>
          <p>A local organisation wants <strong>80 lunch packs</strong>. Revenue could reach <strong>$1,200</strong>. Your current setup comfortably handles about <strong>40</strong>.</p>
        </div>

        <div class="order-bay">
          <div class="capacity-gauge"><span>COMFORTABLE CAPACITY</span><strong>40</strong><small>packs</small></div>
          <div class="order-console">
            <label>Orders you will commit to
              <input id="order-quantity" type="range" min="0" max="80" value="50" step="5" />
              <output id="order-output">50 packs</output>
            </label>
            <div class="order-numbers">
              <span><small>REVENUE</small><strong id="order-revenue">$750</strong></span>
              <span><small>LOAD</small><strong id="order-load">STRETCHED</strong></span>
            </div>
            <div id="order-preview" class="live-feedback">You are taking more than today's comfortable capacity, but not the whole job.</div>
            <button id="commit-order" class="primary-button compact" type="button">Commit to order</button>
          </div>
        </div>
      </section>
    `;

    const quantity = document.getElementById("order-quantity");
    const output = document.getElementById("order-output");
    const revenue = document.getElementById("order-revenue");
    const load = document.getElementById("order-load");
    const preview = document.getElementById("order-preview");

    function refreshOrder() {
      const q = Number(quantity.value);
      output.value = `${q} packs`;
      revenue.textContent = formatCash(q * 15);
      if (q === 0) {
        load.textContent = "NONE";
        preview.textContent = "You are protecting the workload you already have, but the opportunity will disappear.";
      } else if (q <= 40) {
        load.textContent = "SAFE";
        preview.textContent = "This sits inside the capacity your business can currently deliver comfortably.";
      } else if (q <= 55) {
        load.textContent = "STRETCHED";
        preview.textContent = "You are stretching the business, but there is still a realistic path to delivery.";
      } else {
        load.textContent = "OVERLOADED";
        preview.textContent = "Revenue is climbing fast, but the promised workload is now well beyond comfortable capacity.";
      }
    }

    quantity.addEventListener("input", refreshOrder);
    refreshOrder();

    document.getElementById("commit-order").addEventListener("click", () => {
      const q = Number(quantity.value);
      let effects;
      let text;
      if (q === 0) {
        effects = { confidence: -3, capacity: 4 };
        text = "You protect the customers and workload you already have. The opportunity disappears, but the business stays stable.";
      } else if (q <= 40) {
        effects = { cash: q * 15, reputation: 5, capacity: -5, confidence: 5 };
        text = "You accept only what the current business can comfortably deliver. The revenue is smaller, but the job lands cleanly.";
      } else if (q <= 55) {
        effects = { cash: q * 15, reputation: 8, capacity: -10, confidence: 8 };
        text = "You negotiate the opportunity down to a size the business can realistically stretch to deliver.";
      } else {
        effects = { cash: q * 15, capacity: -25, reputation: -8, confidence: 2 };
        text = "The revenue looks fantastic. The workload does not. The business becomes overloaded and some orders arrive late.";
      }
      applyEffects(effects);
      consequence({
        title: "Order confirmed",
        text,
        principle: "Growth isn't just getting more customers. It's being able to deliver what you sell.",
        nextDay: 78,
        nextRender: renderDay78,
      });
    }, { once: true });
  }

  function renderDay78() {
    cashFlowActions = { followedUp: false, paidSupplier: false };

    screen.innerHTML = `
      <section class="sim-screen cashflow-screen">
        <div class="scene-heading">
          <span class="panel-kicker">DAY 78 · CASH FLOW</span>
          <h2>The money exists. It just isn't all here.</h2>
          <p>Sales have been made, but some cash has not arrived yet. Work directly from the two documents on your desk.</p>
        </div>

        <div class="desk-scene">
          <button id="customer-invoice" class="document-card receivable" type="button">
            <small>MONEY OWED TO YOU</small>
            <strong>$640</strong>
            <span id="invoice-status">Tap to follow up</span>
          </button>
          <button id="supplier-bill" class="document-card payable" type="button">
            <small>SUPPLIER BILL DUE</small>
            <strong>$420</strong>
            <span id="bill-status">Tap to pay</span>
          </button>
          <div class="cash-drawer"><small>AVAILABLE CASH</small><strong id="desk-cash">${formatCash(state.cash)}</strong></div>
        </div>

        <div id="cashflow-log" class="live-feedback">Nothing has moved yet. The supplier bill is due and the customer still owes you money.</div>
        <button id="finish-day" class="primary-button compact" type="button">Finish Day 78</button>
      </section>
    `;

    const invoice = document.getElementById("customer-invoice");
    const bill = document.getElementById("supplier-bill");
    const invoiceStatus = document.getElementById("invoice-status");
    const billStatus = document.getElementById("bill-status");
    const deskCash = document.getElementById("desk-cash");
    const log = document.getElementById("cashflow-log");

    invoice.addEventListener("click", () => {
      if (cashFlowActions.followedUp) return;
      cashFlowActions.followedUp = true;
      invoice.classList.add("resolved");
      invoiceStatus.textContent = "Follow-up sent · $420 received";
      applyEffects({ cash: 420, confidence: 5 });
      window.setTimeout(() => { deskCash.textContent = formatCash(state.cash); }, 200);
      log.textContent = "The conversation is uncomfortable, but part of the outstanding invoice arrives today.";
    });

    bill.addEventListener("click", () => {
      if (cashFlowActions.paidSupplier) return;
      cashFlowActions.paidSupplier = true;
      bill.classList.add("resolved");
      billStatus.textContent = "Paid today";
      applyEffects({ cash: -420 });
      window.setTimeout(() => { deskCash.textContent = formatCash(state.cash); }, 200);
      log.textContent = cashFlowActions.followedUp
        ? "The customer payment gave you room to clear the supplier bill without draining the same cash reserve."
        : "The supplier is paid, but the unpaid customer invoice is still tying up cash you've already earned.";
    });

    document.getElementById("finish-day").addEventListener("click", () => {
      const effects = {};
      let text;
      if (!cashFlowActions.followedUp) effects.confidence = -4;
      if (!cashFlowActions.paidSupplier && state.cash < 420) {
        effects.capacity = -4;
        effects.reputation = -3;
      }
      applyEffects(effects);

      if (cashFlowActions.followedUp && cashFlowActions.paidSupplier) {
        text = "You actively manage both sides of the cash-flow problem: collect money owed and clear the bill due.";
      } else if (cashFlowActions.followedUp) {
        text = "You improve available cash by following up what you're owed. The supplier bill is still waiting.";
      } else if (cashFlowActions.paidSupplier) {
        text = "You keep the supplier current, but use your own available cash while money owed to the business remains outstanding.";
      } else {
        text = "You wait. Sales may look healthy on paper, but bills are still due before all of the money has arrived.";
      }

      consequence({
        title: "Cash flow is visible now",
        text,
        principle: "PROFIT IS NOT THE SAME AS CASH FLOW.",
        nextDay: 90,
        nextRender: renderResults,
      });
    }, { once: true });
  }

  function getOutcome() {
    const metricAverage = (state.reputation + state.capacity + state.confidence) / 3;
    const cashScore = state.cash >= 1200 ? 100 : state.cash >= 800 ? 80 : state.cash >= 450 ? 60 : state.cash >= 200 ? 40 : 20;
    const score = metricAverage * 0.72 + cashScore * 0.28;

    if (score >= 78) return { title: "THRIVING BUSINESS", className: "thriving", text: "You balanced customers, money, capacity and growth exceptionally well. Your pakihi enters its next 90 days from a strong position." };
    if (score >= 64) return { title: "GROWING PAKIHI", className: "growing", text: "Customers are returning, your decision-making is improving and the business has room to grow." };
    if (score >= 48) return { title: "FINDING YOUR FEET", className: "finding", text: "You've built the beginnings of a viable business. Some decisions paid off. Others exposed weaknesses you'll need to manage as you grow." };
    return { title: "STILL STARTING OUT", className: "starting", text: "The pakihi is still alive, but cash pressure and difficult decisions have made growth challenging. You survived 90 days. Now try again with a different strategy." };
  }

  function renderResults() {
    const outcome = getOutcome();
    screen.innerHTML = `
      <section class="results-screen ${outcome.className}">
        <div class="results-panel">
          <span class="panel-kicker">DAY 90 · YOUR RESULT</span>
          <div class="result-badge">90</div>
          <h2>${outcome.title}</h2>
          <p>${outcome.text}</p>
          <div class="result-metrics">
            <span><small>PŪTEA</small><strong>${formatCash(state.cash)}</strong></span>
            <span><small>REPUTATION</small><strong>${state.reputation}</strong></span>
            <span><small>CAPACITY</small><strong>${state.capacity}</strong></span>
            <span><small>CONFIDENCE</small><strong>${state.confidence}</strong></span>
          </div>
          <button id="see-reflection" class="primary-button compact" type="button">See what you practised</button>
        </div>
      </section>
    `;
    document.getElementById("see-reflection").addEventListener("click", renderReflection, { once: true });
  }

  function renderReflection() {
    hud.classList.add("is-hidden");
    screen.innerHTML = `
      <section class="reflection-screen">
        <div class="reflection-panel">
          <span class="panel-kicker">WHAT DID YOU ACTUALLY PRACTISE?</span>
          <h2>You ran the business. The learning sat underneath it.</h2>
          <div class="skill-grid">
            <span>Pricing</span><span>Cash flow</span><span>Customer relationships</span><span>Managing costs</span><span>Capacity</span><span>Growth decisions</span>
          </div>
          <p>This prototype doesn't test whether you remember business terminology. It lets you practise making business decisions and experience what those choices can affect.</p>
          <button id="play-again" class="primary-button" type="button">Play again</button>
        </div>
      </section>
    `;
    document.getElementById("play-again").addEventListener("click", renderOpening, { once: true });
  }

  aboutButton.addEventListener("click", () => {
    if (typeof aboutDialog.showModal === "function") aboutDialog.showModal();
    else aboutDialog.setAttribute("open", "");
  });

  setWorld();
  renderOpening();
})();
