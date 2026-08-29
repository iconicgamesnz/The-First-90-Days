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

  const metricLabels = {
    cash: "Pūtea",
    reputation: "Reputation",
    capacity: "Capacity",
    confidence: "Confidence",
  };

  const metricContainers = Object.fromEntries(
    Object.keys(metricEls).map((key) => [key, document.querySelector(`[data-metric="${key}"]`)])
  );

  const initialState = Object.freeze({
    cash: 750,
    reputation: 50,
    capacity: 50,
    confidence: 50,
  });

  let state = { ...initialState };
  let currentScenarioIndex = 0;
  let transitionTimer = null;
  let locked = false;

  const scenarios = [
    {
      day: 1,
      kicker: "STARTING OUT",
      title: "Where does the money go first?",
      copy: "You've saved $750 to start your business. You need stock, equipment and a way for customers to find you.",
      prompt: "Where do you put your money first?",
      choices: [
        {
          label: "Look professional",
          hint: "Spend $500 on branding, signage and presentation.",
          effects: { cash: -500, reputation: 8, confidence: 5 },
          consequence: "Your stall looks incredible and customers notice you immediately. But you've spent most of your available cash before you've proven what people will buy.",
        },
        {
          label: "Start lean",
          hint: "Spend $220 on basic stock and equipment and keep the rest available.",
          effects: { cash: -220, capacity: 5, confidence: 7 },
          consequence: "It isn't flashy, but you're trading. More importantly, you've kept enough cash to respond when something unexpected happens.",
        },
        {
          label: "Wait until everything is perfect",
          hint: "Spend nothing yet.",
          effects: { confidence: -8, reputation: -2 },
          consequence: "Your money is safe. But another week passes without customers, feedback or sales.",
        },
      ],
    },
    {
      day: 10,
      kicker: "YOUR FIRST BIG CUSTOMER",
      title: "A customer wants a deal",
      copy: "“Kia ora! I love what you're doing. Could you do this order for $120 instead of $180? I'll definitely tell everyone about you.”",
      quote: true,
      choices: [
        {
          label: "Take the $120",
          hint: "Make the sale at the lower price.",
          effects: { cash: 120, reputation: 4, capacity: -6 },
          consequence: "You made the sale, but the margin is much smaller than planned.",
        },
        {
          label: "Stay at $180",
          hint: "Protect the original price.",
          effects: { confidence: 5 },
          consequence: "You protected your price, but the customer decides not to order today.",
        },
        {
          label: "Offer $150 with a smaller order",
          hint: "Change the offer instead of simply discounting.",
          effects: { cash: 150, reputation: 7, confidence: 5, capacity: -3 },
          consequence: "Instead of simply discounting, you changed the offer.",
          principle: "Price and value don't always have to move together.",
        },
      ],
    },
    {
      day: 24,
      kicker: "CUSTOMER COMPLAINT",
      title: "Something wasn't right",
      copy: "“Kia ora. My order wasn't what I expected. I'm pretty disappointed.”",
      quote: true,
      note: "Fixing it will cost approximately $65.",
      choices: [
        {
          label: "Fix it immediately",
          hint: "Replace the order now.",
          effects: { cash: -65, reputation: 12, capacity: -7 },
          consequence: "The problem costs you money and time, but the customer feels listened to.",
        },
        {
          label: "Explain they received what they ordered",
          hint: "Stand by the original transaction.",
          effects: { reputation: -10, confidence: 2 },
          consequence: "Technically, you may be right. But being right and protecting the customer relationship aren't always the same thing.",
        },
        {
          label: "Offer a partial refund or replacement",
          hint: "Find a middle ground.",
          effects: { cash: -35, reputation: 6, capacity: -3 },
          consequence: "You find a compromise that costs less while still acknowledging the customer's experience.",
        },
      ],
    },
    {
      day: 41,
      kicker: "SUPPLIER UPDATE",
      title: "Ingredient costs have increased",
      copy: "Your usual stock order now costs $110 more.",
      choices: [
        {
          label: "Absorb the cost",
          hint: "Keep customer prices unchanged.",
          effects: { cash: -110, reputation: 3 },
          consequence: "Customers see no change, but your margin becomes tighter.",
        },
        {
          label: "Increase prices",
          hint: "Protect more of your margin.",
          effects: { cash: 80, reputation: -4, confidence: 4 },
          consequence: "Your margin improves, but some customers notice the price change.",
        },
        {
          label: "Change part of the product range",
          hint: "Redesign what you sell.",
          effects: { cash: -35, capacity: -3, confidence: 6 },
          consequence: "You redesign what you sell rather than simply accepting the cost increase.",
          principle: "When costs change, businesses can change price, product, process—or all three.",
        },
      ],
    },
    {
      day: 63,
      kicker: "BIG OPPORTUNITY",
      title: "80 lunch packs. One big decision.",
      copy: "A local organisation wants 80 lunch packs for an event. Revenue: $1,200. But your current setup comfortably handles only about 40.",
      choices: [
        {
          label: "Say yes",
          hint: "Accept all 80 orders.",
          effects: { cash: 1200, capacity: -25, reputation: -8 },
          consequence: "The revenue looks fantastic. But the workload stretches the business beyond its current capacity and some orders are late.",
        },
        {
          label: "Say no",
          hint: "Protect the workload you already have.",
          effects: { confidence: -3, capacity: 4 },
          consequence: "You protect your current customers and workload, but the opportunity disappears.",
        },
        {
          label: "Negotiate 50 orders",
          hint: "Take the part the business can realistically deliver.",
          effects: { cash: 750, reputation: 8, capacity: -10, confidence: 8 },
          consequence: "You don't take the whole opportunity—but you take the part the business can realistically deliver.",
          principle: "Growth isn't just getting more customers. It's being able to deliver what you sell.",
        },
      ],
    },
    {
      day: 78,
      kicker: "CASH FLOW",
      title: "Sales made. Cash still missing.",
      copy: "You've made sales. But some of the money hasn't arrived yet.",
      moneyPanel: true,
      choices: [
        {
          label: "Wait for the customer to pay",
          hint: "Do nothing today.",
          effects: (current) => current.cash < 420
            ? { confidence: -4, capacity: -4, reputation: -3 }
            : { confidence: -4 },
          consequence: (current) => current.cash < 420
            ? "You wait, but the low cash balance creates pressure immediately. Work slows and the supplier relationship becomes harder to manage."
            : "You decide to wait. There is enough cash to keep moving today, but the unpaid invoice is still tying up money your business has already earned.",
        },
        {
          label: "Follow up the invoice today",
          hint: "Have the uncomfortable conversation.",
          effects: { confidence: 5, cash: 420 },
          consequence: "The conversation is uncomfortable—but the customer pays part of what they owe.",
        },
        {
          label: "Use your remaining cash and say nothing",
          hint: "Pay the supplier bill yourself.",
          effects: { cash: -420 },
          consequence: "The bill is paid, but the business has much less room for another unexpected expense.",
        },
      ],
      principle: "PROFIT IS NOT THE SAME AS CASH FLOW.",
    },
  ];

  const outcomeCopy = [
    {
      key: "starting",
      title: "STILL STARTING OUT",
      text: "The pakihi is still alive, but cash pressure and difficult decisions have made growth challenging. You survived 90 days. Now try again with a different strategy.",
    },
    {
      key: "finding",
      title: "FINDING YOUR FEET",
      text: "You've built the beginnings of a viable business. Some decisions paid off. Others exposed weaknesses you'll need to manage as you grow.",
    },
    {
      key: "growing",
      title: "GROWING PAKIHI",
      text: "Customers are returning, your decision-making is improving and the business has room to grow.",
    },
    {
      key: "thriving",
      title: "THRIVING BUSINESS",
      text: "You balanced customers, money, capacity and growth exceptionally well. Your pakihi enters its next 90 days from a strong position.",
    },
  ];

  const assetPath = (file) => {
    const base = "game-assets/first-90-days-assets/generated-assets/";
    return window.location.protocol === "file:"
      ? `./public/${base}${file}`
      : `/${base}${file}`;
  };

  function setWorldArt(file = "market-hub-reference.png") {
    worldArt.src = assetPath(file);
  }

  function initialiseSparkles() {
    const host = document.getElementById("sparkles");
    for (let i = 0; i < 14; i += 1) {
      const dot = document.createElement("i");
      dot.className = "sparkle";
      dot.style.left = `${8 + Math.random() * 84}%`;
      dot.style.top = `${8 + Math.random() * 74}%`;
      dot.style.animationDelay = `${Math.random() * 5}s`;
      dot.style.animationDuration = `${4 + Math.random() * 4}s`;
      host.appendChild(dot);
    }
  }

  function formatCash(value) {
    const safe = Number.isFinite(value) ? Math.round(value) : 0;
    return `${safe < 0 ? "−" : ""}$${Math.abs(safe).toLocaleString("en-NZ")}`;
  }

  function clampMetric(value) {
    const safe = Number.isFinite(value) ? value : 0;
    return Math.max(0, Math.min(100, Math.round(safe)));
  }

  function sanitiseState() {
    if (!Number.isFinite(state.cash)) state.cash = 0;
    state.cash = Math.round(state.cash);
    state.reputation = clampMetric(state.reputation);
    state.capacity = clampMetric(state.capacity);
    state.confidence = clampMetric(state.confidence);
  }

  function updateHud(animateKey = null, direction = 0) {
    sanitiseState();
    metricEls.cash.textContent = formatCash(state.cash);
    metricEls.reputation.textContent = `${state.reputation}`;
    metricEls.capacity.textContent = `${state.capacity}`;
    metricEls.confidence.textContent = `${state.confidence}`;

    if (animateKey && metricContainers[animateKey]) {
      const el = metricContainers[animateKey];
      const cls = direction >= 0 ? "bump-positive" : "bump-negative";
      el.classList.remove("bump-positive", "bump-negative");
      void el.offsetWidth;
      el.classList.add(cls);
      window.setTimeout(() => el.classList.remove(cls), 750);
    }
  }

  function showFloatingChange(key, amount, delay = 0) {
    window.setTimeout(() => {
      const node = document.createElement("div");
      const positive = amount > 0;
      node.className = `floating-change ${positive ? "positive" : "negative"}`;
      const value = key === "cash" ? formatSignedCash(amount) : `${amount > 0 ? "+" : ""}${amount}`;
      node.textContent = `${metricLabels[key]} ${value}`;
      effectLayer.appendChild(node);
      window.setTimeout(() => node.remove(), 1800);
      if (key === "cash" && amount > 0) scatterCoins();
    }, delay);
  }

  function formatSignedCash(value) {
    const safe = Math.round(value);
    return `${safe >= 0 ? "+" : "−"}$${Math.abs(safe).toLocaleString("en-NZ")}`;
  }

  function scatterCoins() {
    for (let i = 0; i < 7; i += 1) {
      const coin = document.createElement("i");
      coin.className = "coin";
      coin.style.left = `${42 + Math.random() * 16}%`;
      coin.style.top = `${25 + Math.random() * 7}%`;
      coin.style.setProperty("--dx", `${-60 + Math.random() * 120}px`);
      coin.style.setProperty("--dy", `${80 + Math.random() * 130}px`);
      coin.style.animationDelay = `${i * 45}ms`;
      effectLayer.appendChild(coin);
      window.setTimeout(() => coin.remove(), 1100);
    }
  }

  function renderOpening() {
    clearTransitionTimer();
    locked = false;
    currentScenarioIndex = 0;
    state = { ...initialState };
    app.classList.remove("is-playing");
    hud.classList.add("is-hidden");
    setWorldArt("market-hub-reference.png");
    updateHud();

    screen.innerHTML = `
      <section class="hero-screen">
        <div class="hero-layout">
          <div class="hero-copy">
            <div class="logo-lockup">
              <span>ICONIC GAMES PRESENTS</span>
              <strong>FIRST 90 DAYS</strong>
            </div>
            <h1>Build your pakihi.<em>Live with the consequences.</em></h1>
            <p class="hero-tagline">You have an idea. $750. One market stall. And 90 days to see whether your pakihi can survive.</p>
            <p class="hero-story">There isn't always one right answer. Make the decisions you think are best and see what happens.</p>
            <button id="start-button" class="primary-button" type="button">Start your pakihi</button>
          </div>
          <div class="hero-character" aria-hidden="true">
            <img src="${assetPath("female-maori-character-sheet.png")}" alt="" />
            <div class="hero-character-label">Your first 90 days start here</div>
          </div>
        </div>
      </section>
    `;

    document.getElementById("start-button").addEventListener("click", startGame, { once: true });
  }

  function startGame() {
    app.classList.add("is-playing");
    hud.classList.remove("is-hidden");
    showDayTransition(0);
  }

  function clearTransitionTimer() {
    if (transitionTimer !== null) {
      window.clearTimeout(transitionTimer);
      transitionTimer = null;
    }
  }

  function showDayTransition(index) {
    clearTransitionTimer();
    locked = false;
    const scenario = scenarios[index];
    document.getElementById("hud-day").textContent = `${scenario.day}`;
    screen.innerHTML = `
      <section class="day-transition">
        <span class="day-word">DAY</span>
        <strong class="day-number">${scenario.day}</strong>
        <p>${scenario.kicker}</p>
      </section>
    `;
    transitionTimer = window.setTimeout(() => renderScenario(index), 820);
  }

  function renderScenario(index) {
    clearTransitionTimer();
    currentScenarioIndex = index;
    locked = false;
    const scenario = scenarios[index];
    document.getElementById("hud-day").textContent = `${scenario.day}`;

    const moneyPanel = scenario.moneyPanel
      ? `
        <div class="score-grid" aria-label="Cash flow snapshot">
          <div class="score-tile"><small>MONEY OWED TO YOU</small><strong>$640</strong></div>
          <div class="score-tile"><small>SUPPLIER BILL DUE</small><strong>$420</strong></div>
          <div class="score-tile"><small>AVAILABLE CASH</small><strong>${formatCash(state.cash)}</strong></div>
          <div class="score-tile"><small>STATUS</small><strong>${state.cash >= 420 ? "Room to move" : "Tight"}</strong></div>
        </div>
      `
      : "";

    const note = scenario.note ? `<p class="principle">${scenario.note}</p>` : "";
    const choices = scenario.choices.map((choice, choiceIndex) => `
      <button class="choice-button" type="button" data-choice="${choiceIndex}">
        <strong>${choice.label}</strong>
        <span>${choice.hint}</span>
      </button>
    `).join("");

    screen.innerHTML = `
      <section class="scenario-card">
        <div class="scenario-header">
          <div class="scenario-kicker">DAY ${scenario.day} · ${scenario.kicker}</div>
          <h2>${scenario.title}</h2>
        </div>
        <div class="scenario-body">
          <p class="scenario-copy ${scenario.quote ? "quote" : ""}">${scenario.copy}</p>
          ${moneyPanel}
          ${note}
          ${scenario.prompt ? `<p class="scenario-copy">${scenario.prompt}</p>` : ""}
          <div class="choice-grid">${choices}</div>
        </div>
      </section>
    `;

    screen.querySelectorAll("[data-choice]").forEach((button) => {
      button.addEventListener("click", () => chooseOption(index, Number(button.dataset.choice)));
    });
  }

  function resolveEffects(choice) {
    const raw = typeof choice.effects === "function" ? choice.effects({ ...state }) : choice.effects;
    return Object.fromEntries(
      Object.entries(raw || {}).filter(([key, value]) => Object.hasOwn(state, key) && Number.isFinite(value))
    );
  }

  function chooseOption(index, choiceIndex) {
    if (locked) return;
    locked = true;
    const scenario = scenarios[index];
    const choice = scenario.choices[choiceIndex];
    const stateBefore = { ...state };
    const effects = resolveEffects(choice);

    Object.entries(effects).forEach(([key, amount], effectIndex) => {
      state[key] += amount;
      if (key !== "cash") state[key] = clampMetric(state[key]);
      showFloatingChange(key, amount, effectIndex * 180);
      window.setTimeout(() => updateHud(key, amount), effectIndex * 180);
    });

    sanitiseState();
    updateHud();

    const consequence = typeof choice.consequence === "function"
      ? choice.consequence(stateBefore)
      : choice.consequence;
    const principle = choice.principle || scenario.principle || "";

    const pills = Object.entries(effects).map(([key, amount]) => {
      const cls = amount > 0 ? "positive" : amount < 0 ? "negative" : "neutral";
      const value = key === "cash" ? formatSignedCash(amount) : `${amount > 0 ? "+" : ""}${amount}`;
      return `<span class="effect-pill ${cls}">${metricLabels[key]} ${value}</span>`;
    }).join("");

    screen.innerHTML = `
      <section class="consequence-card">
        <span class="consequence-badge">Decision made · Day ${scenario.day}</span>
        <h2>${choice.label}</h2>
        <div class="effect-list">${pills || '<span class="effect-pill neutral">No immediate metric change</span>'}</div>
        <p class="consequence-copy">${consequence}</p>
        ${principle ? `<div class="principle"><strong>Business principle:</strong> ${principle}</div>` : ""}
        <button id="continue-button" class="primary-button" type="button">${index === scenarios.length - 1 ? "See Day 90" : "Continue"}</button>
      </section>
    `;

    document.getElementById("continue-button").addEventListener("click", () => continueFrom(index), { once: true });
  }

  function continueFrom(index) {
    if (index < scenarios.length - 1) {
      showDayTransition(index + 1);
      return;
    }
    showDay90Transition();
  }

  function showDay90Transition() {
    clearTransitionTimer();
    document.getElementById("hud-day").textContent = "90";
    screen.innerHTML = `
      <section class="day-transition">
        <span class="day-word">DAY</span>
        <strong class="day-number">90</strong>
        <p>THE FIRST CHAPTER CLOSES</p>
      </section>
    `;
    transitionTimer = window.setTimeout(renderResults, 950);
  }

  function calculateOutcome() {
    const cashScore = Math.max(0, Math.min(100, (state.cash + 100) / 18));
    const score = (cashScore + state.reputation + state.capacity + state.confidence) / 4;

    if (score < 42) return { ...outcomeCopy[0], score };
    if (score < 56) return { ...outcomeCopy[1], score };
    if (score < 69) return { ...outcomeCopy[2], score };
    return { ...outcomeCopy[3], score };
  }

  function renderResults() {
    clearTransitionTimer();
    const outcome = calculateOutcome();
    updateHud();

    screen.innerHTML = `
      <section class="results-card" data-outcome="${outcome.key}">
        <div class="panel-kicker">DAY 90 RESULTS</div>
        <h2>Your first 90 days</h2>
        <p class="results-intro">Six decisions changed the shape of the business. This is the position you've created.</p>
        <div class="score-grid">
          <div class="score-tile"><small>PŪTEA / CASH</small><strong>${formatCash(state.cash)}</strong></div>
          <div class="score-tile"><small>REPUTATION</small><strong>${state.reputation} / 100</strong></div>
          <div class="score-tile"><small>CAPACITY</small><strong>${state.capacity} / 100</strong></div>
          <div class="score-tile"><small>CONFIDENCE</small><strong>${state.confidence} / 100</strong></div>
        </div>
        <div class="outcome-banner">
          <div class="panel-kicker">YOUR OUTCOME</div>
          <h3>${outcome.title}</h3>
          <p>${outcome.text}</p>
        </div>
        <button id="reflection-button" class="primary-button" type="button">What did I practise?</button>
      </section>
    `;

    document.getElementById("reflection-button").addEventListener("click", renderReflection, { once: true });
  }

  function renderReflection() {
    screen.innerHTML = `
      <section class="reflection-wrap">
        <div class="panel-kicker">REFLECTION</div>
        <h2>What did you actually practise?</h2>
        <p>This prototype doesn't test whether you remember business terminology. It lets you practise making business decisions and experience what those choices can affect.</p>
        <div class="reflection-grid">
          <div class="reflection-card"><span>🏷️</span><strong>Pricing</strong></div>
          <div class="reflection-card"><span>💵</span><strong>Cash flow</strong></div>
          <div class="reflection-card"><span>🤝</span><strong>Customer relationships</strong></div>
          <div class="reflection-card"><span>📦</span><strong>Managing costs</strong></div>
          <div class="reflection-card"><span>⚙️</span><strong>Capacity</strong></div>
          <div class="reflection-card"><span>↗</span><strong>Growth decisions</strong></div>
        </div>
        <p class="principle"><strong>The model:</strong> decision → consequence → changing business state → reflection → replay.</p>
        <button id="replay-button" class="primary-button" type="button">Play again</button>
      </section>
    `;

    document.getElementById("replay-button").addEventListener("click", renderOpening, { once: true });
  }

  aboutButton.addEventListener("click", () => {
    if (typeof aboutDialog.showModal === "function") {
      aboutDialog.showModal();
    } else {
      aboutDialog.setAttribute("open", "");
    }
  });

  aboutDialog.addEventListener("click", (event) => {
    if (event.target === aboutDialog) aboutDialog.close();
  });

  setWorldArt();
  initialiseSparkles();
  renderOpening();
})();
