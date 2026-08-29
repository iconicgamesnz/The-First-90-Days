import "./style.css";

type SceneMode = "ambient" | "customer";
type Speaker = "CUSTOMER" | "YOU";

interface DialogueBeat {
  speaker: Speaker;
  text: string;
}

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }

  return element as T;
}

const titleScreen = requiredElement<HTMLElement>("title-screen");
const startButton = requiredElement<HTMLButtonElement>("start-game");
const gameUi = requiredElement<HTMLElement>("game-ui");
const ambientVideo = requiredElement<HTMLVideoElement>("ambient-video");
const customerVideo = requiredElement<HTMLVideoElement>("customer-video");
const doorChime = requiredElement<HTMLElement>("door-chime");

const cashValue = requiredElement<HTMLElement>("cash-value");
const reputationValue = requiredElement<HTMLElement>("reputation-value");
const capacityValue = requiredElement<HTMLElement>("capacity-value");
const confidenceValue = requiredElement<HTMLElement>("confidence-value");
const objectiveText = requiredElement<HTMLElement>("objective-text");

const dialoguePanel = requiredElement<HTMLElement>("dialogue-panel");
const dialogueSpeaker = requiredElement<HTMLElement>("dialogue-speaker");
const dialogueText = requiredElement<HTMLElement>("dialogue-text");
const dialogueContinue = requiredElement<HTMLButtonElement>("dialogue-continue");

const tillHotspot = requiredElement<HTMLButtonElement>("till-hotspot");
const interactionPrompt = requiredElement<HTMLElement>("interaction-prompt");
const dayComplete = requiredElement<HTMLElement>("day-complete");
const replayDay = requiredElement<HTMLButtonElement>("replay-day");

const openingDialogue: DialogueBeat[] = [
  {
    speaker: "CUSTOMER",
    text: "Kia ora! Just this basket today, please.",
  },
  {
    speaker: "YOU",
    text: "Kia ora — I'll put that through for you.",
  },
  {
    speaker: "CUSTOMER",
    text: "Sweet as. $18 is all good.",
  },
];

let cash = 750;
let reputation = 50;
let capacity = 50;
let confidence = 50;
let dialogueIndex = 0;
let hasStarted = false;
let saleComplete = false;
let scheduledTimers: number[] = [];

function schedule(callback: () => void, delay: number): void {
  const timer = window.setTimeout(callback, delay);
  scheduledTimers.push(timer);
}

function clearScheduledTimers(): void {
  for (const timer of scheduledTimers) {
    window.clearTimeout(timer);
  }

  scheduledTimers = [];
}

function playVideo(video: HTMLVideoElement): void {
  void video.play().catch(() => {
    /* The poster remains visible if the optional MP4 is not installed yet. */
  });
}

function setScene(mode: SceneMode): void {
  const showingAmbient = mode === "ambient";

  ambientVideo.classList.toggle("active", showingAmbient);
  customerVideo.classList.toggle("active", !showingAmbient);

  if (showingAmbient) {
    playVideo(ambientVideo);
    customerVideo.pause();
  } else {
    playVideo(customerVideo);
    ambientVideo.pause();
  }
}

function updateBusinessHud(): void {
  cashValue.textContent = `$${cash}`;
  reputationValue.textContent = String(reputation);
  capacityValue.textContent = String(capacity);
  confidenceValue.textContent = String(confidence);
}

function setObjective(text: string): void {
  objectiveText.textContent = text;
}

function hideDialogue(): void {
  dialoguePanel.classList.add("hidden");
}

function showDialogue(beat: DialogueBeat, showContinue = true): void {
  dialogueSpeaker.textContent = beat.speaker;
  dialogueText.textContent = beat.text;
  dialogueContinue.classList.toggle("hidden", !showContinue);
  dialoguePanel.classList.remove("hidden");
}

function showCurrentDialogue(): void {
  const beat = openingDialogue[dialogueIndex];

  if (!beat) {
    beginTillInteraction();
    return;
  }

  showDialogue(beat);
}

function beginTillInteraction(): void {
  hideDialogue();
  setObjective("Take payment at the till");
  interactionPrompt.classList.remove("hidden");
  tillHotspot.classList.remove("hidden");
}

function customerArrives(): void {
  doorChime.classList.remove("hidden");
  setObjective("A customer is coming to the counter");

  schedule(() => {
    doorChime.classList.add("hidden");
    setScene("customer");
    setObjective("Talk with your first customer");
    dialogueIndex = 0;
    showCurrentDialogue();
  }, 1100);
}

function completeSale(): void {
  if (saleComplete) {
    return;
  }

  saleComplete = true;
  tillHotspot.classList.add("hidden");
  interactionPrompt.classList.add("hidden");

  cash += 18;
  reputation += 1;
  confidence += 3;
  updateBusinessHud();

  setObjective("Sale complete");
  showDialogue(
    {
      speaker: "CUSTOMER",
      text: "Kia ora — thanks! Have a good one.",
    },
    false,
  );

  schedule(() => {
    hideDialogue();
    setScene("ambient");
    setObjective("Day 1 complete — the shop keeps moving");
  }, 1500);

  schedule(() => {
    dayComplete.classList.remove("hidden");
  }, 2350);
}

function resetDayState(): void {
  clearScheduledTimers();

  cash = 750;
  reputation = 50;
  capacity = 50;
  confidence = 50;
  dialogueIndex = 0;
  saleComplete = false;

  updateBusinessHud();

  dayComplete.classList.add("hidden");
  dialoguePanel.classList.add("hidden");
  dialogueContinue.classList.remove("hidden");
  tillHotspot.classList.add("hidden");
  interactionPrompt.classList.add("hidden");
  doorChime.classList.add("hidden");

  ambientVideo.currentTime = 0;
  customerVideo.currentTime = 0;
  setScene("ambient");
  setObjective("Open the shop and watch the morning begin");
}

function beginDay(): void {
  resetDayState();

  schedule(() => {
    setObjective("The shop is open — watch who's coming in");
  }, 900);

  schedule(customerArrives, 3300);
}

function beginGame(): void {
  if (hasStarted) {
    return;
  }

  hasStarted = true;
  titleScreen.classList.add("hidden");
  gameUi.classList.remove("hidden");
  beginDay();
}

startButton.addEventListener("click", beginGame);

dialogueContinue.addEventListener("click", () => {
  dialogueIndex += 1;
  showCurrentDialogue();
});

tillHotspot.addEventListener("click", completeSale);

replayDay.addEventListener("click", () => {
  beginDay();
});

ambientVideo.addEventListener("canplay", () => {
  if (hasStarted && ambientVideo.classList.contains("active")) {
    playVideo(ambientVideo);
  }
});

customerVideo.addEventListener("canplay", () => {
  if (hasStarted && customerVideo.classList.contains("active")) {
    playVideo(customerVideo);
  }
});

updateBusinessHud();
