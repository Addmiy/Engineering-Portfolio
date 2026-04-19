const traitLibrary = [
  {
    id: "discipline",
    label: "Discipline",
    mantra: "Structure beats mood.",
    objective:
      "Structure your first choice so the rest of the day has less room to drift.",
    target: "Move before mood negotiates.",
    kicker: "Wake with structure.",
    sequence: [
      {
        title: "Start before comfort votes.",
        copy: "Your first decision teaches the rest of the day what is allowed."
      },
      {
        title: "Reduce delay to zero.",
        copy: "Stand up, breathe deeply, and touch the task that matters first."
      },
      {
        title: "Earn momentum through action.",
        copy: "Discipline is built when your body obeys a clear instruction immediately."
      }
    ]
  },
  {
    id: "focus",
    label: "Focus",
    mantra: "Protect the signal.",
    objective:
      "Cut noise early so your attention belongs to work instead of random inputs.",
    target: "Choose one lane and stay inside it.",
    kicker: "Protect attention.",
    sequence: [
      {
        title: "Attention is a gate.",
        copy: "What enters your mind first usually steers the entire morning."
      },
      {
        title: "Refuse scattered starts.",
        copy: "Open one priority, close everything else, and let depth do the heavy lifting."
      },
      {
        title: "Win the first hour.",
        copy: "Focused beginnings make the rest of the schedule easier to defend."
      }
    ]
  },
  {
    id: "consistency",
    label: "Consistency",
    mantra: "Repeated action creates trust.",
    objective:
      "Turn isolated effort into a dependable pattern that you can rely on daily.",
    target: "Show up in the same direction again.",
    kicker: "Return to the standard.",
    sequence: [
      {
        title: "Patterns become identity.",
        copy: "You trust yourself more when your actions stop depending on emotion."
      },
      {
        title: "Repeat the right basics.",
        copy: "Simple actions, done daily, compound harder than dramatic effort."
      },
      {
        title: "Protect the chain.",
        copy: "Every steady morning makes tomorrow's start easier to honor."
      }
    ]
  },
  {
    id: "resilience",
    label: "Resilience",
    mantra: "Recover fast, continue clean.",
    objective:
      "Build the habit of returning quickly after difficulty, friction, or imperfect days.",
    target: "Reset fast and continue anyway.",
    kicker: "Resume under pressure.",
    sequence: [
      {
        title: "Hard days are still training days.",
        copy: "Momentum matters most when resistance is present."
      },
      {
        title: "Do not negotiate with discomfort.",
        copy: "Stability is built when you keep moving through low-friction setbacks."
      },
      {
        title: "Recovery is a skill.",
        copy: "Resilience grows when you shorten the time between setback and response."
      }
    ]
  },
  {
    id: "initiative",
    label: "Initiative",
    mantra: "Act before permission appears.",
    objective:
      "Replace passive waiting with voluntary movement toward useful work.",
    target: "Take the first useful step without being prompted.",
    kicker: "Move without prompting.",
    sequence: [
      {
        title: "Progress favors movement.",
        copy: "Starting removes uncertainty faster than overthinking ever will."
      },
      {
        title: "Lead your own morning.",
        copy: "Initiative means you create direction before the world crowds it out."
      },
      {
        title: "Action clarifies.",
        copy: "Most confusion dissolves once the first meaningful step is underway."
      }
    ]
  },
  {
    id: "accountability",
    label: "Accountability",
    mantra: "Keep the promises you can control.",
    objective:
      "Turn intention into evidence by honoring the commitments you set for yourself.",
    target: "Make your own standards visible and real.",
    kicker: "Make the standard visible.",
    sequence: [
      {
        title: "Standards need proof.",
        copy: "Self-respect strengthens when today's actions match today's claims."
      },
      {
        title: "Track what matters.",
        copy: "Visible priorities keep you honest when distraction tries to reframe the day."
      },
      {
        title: "Finish with evidence.",
        copy: "Accountability is not pressure. It is the clarity that follows measured follow-through."
      }
    ]
  }
];

const scheduleItems = [
  {
    start: "06:15",
    end: "06:30",
    title: "Activation reel and first movement",
    note: "No notifications. No scrolling. Just wake, stand, and begin."
  },
  {
    start: "07:00",
    end: "08:00",
    title: "Deep work block one",
    note: "Highest-value work before the day fragments."
  },
  {
    start: "09:30",
    end: "10:00",
    title: "Admin and planning reset",
    note: "Process messages and confirm the next block."
  },
  {
    start: "12:30",
    end: "13:15",
    title: "Training and recovery",
    note: "Energy maintenance supports execution consistency."
  },
  {
    start: "16:00",
    end: "16:30",
    title: "Review and shutdown",
    note: "Close loops, score the day, and protect tomorrow's start."
  }
];

let tasks = [
  { id: 1, title: "Complete the first deep-work deliverable", tag: "Deep Work", done: false },
  { id: 2, title: "Lock tomorrow's calendar blocks before noon", tag: "Planning", done: false },
  { id: 3, title: "Train for 30 minutes after midday reset", tag: "Health", done: true }
];

let activeTraitIndex = 0;
let activeSequenceIndex = 0;
let activationTimer = null;
let activationPaused = false;

const body = document.body;
const traitSelector = document.getElementById("trait-selector");
const briefTitle = document.getElementById("brief-title");
const briefMantra = document.getElementById("brief-mantra");
const behaviourTarget = document.getElementById("behaviour-target");
const summaryTrait = document.getElementById("summary-trait");
const summaryMantra = document.getElementById("summary-mantra");
const previewTrait = document.getElementById("preview-trait");
const previewHeadline = document.getElementById("preview-headline");
const previewCopy = document.getElementById("preview-copy");
const segmentCount = document.getElementById("segment-count");
const sequenceList = document.getElementById("sequence-list");
const countdownDisplay = document.getElementById("countdown-display");
const alarmReadout = document.getElementById("alarm-readout");
const alarmTimeInput = document.getElementById("alarm-time");
const streakDisplay = document.getElementById("streak-display");
const executionScore = document.getElementById("execution-score");
const completionCaption = document.getElementById("completion-caption");
const calendarStrip = document.getElementById("calendar-strip");
const scheduleTimeline = document.getElementById("schedule-timeline");
const nextBlockNote = document.getElementById("next-block-note");
const taskList = document.getElementById("task-list");
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskTag = document.getElementById("task-tag");
const currentDate = document.getElementById("current-date");
const currentTime = document.getElementById("current-time");
const modal = document.getElementById("activation-modal");
const modalClose = document.getElementById("modal-close");
const closeActivation = document.getElementById("close-activation");
const launchActivation = document.getElementById("launch-activation");
const pauseActivation = document.getElementById("pause-activation");
const nextSegment = document.getElementById("next-segment");
const completeActivation = document.getElementById("complete-activation");
const modalTrait = document.getElementById("modal-trait");
const modalKicker = document.getElementById("modal-kicker");
const modalHeadline = document.getElementById("modal-headline");
const modalCopy = document.getElementById("modal-copy");
const modalSegmentIndex = document.getElementById("modal-segment-index");
const modalProgressLabel = document.getElementById("modal-progress-label");
const progressFill = document.getElementById("progress-fill");

function getActiveTrait() {
  return traitLibrary[activeTraitIndex];
}

function renderTraitSelector() {
  traitSelector.innerHTML = "";

  traitLibrary.forEach((trait, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `trait-chip${index === activeTraitIndex ? " active" : ""}`;
    button.textContent = trait.label;
    button.addEventListener("click", () => {
      activeTraitIndex = index;
      activeSequenceIndex = 0;
      applyTrait();
    });
    traitSelector.appendChild(button);
  });
}

function renderSequence() {
  const trait = getActiveTrait();

  sequenceList.innerHTML = "";
  trait.sequence.forEach((item, index) => {
    const step = document.createElement("div");
    step.className = `sequence-step${index === activeSequenceIndex ? " active" : ""}`;
    step.innerHTML = `
      <span class="sequence-index">${index + 1}</span>
      <div>
        <p class="task-title">${item.title}</p>
        <p>${item.copy}</p>
      </div>
    `;
    sequenceList.appendChild(step);
  });
}

function applyTrait() {
  const trait = getActiveTrait();
  const segment = trait.sequence[activeSequenceIndex];

  body.dataset.accent = trait.id;
  briefTitle.textContent = trait.label;
  briefMantra.textContent = trait.objective;
  behaviourTarget.textContent = trait.target;
  summaryTrait.textContent = trait.label;
  summaryMantra.textContent = trait.mantra;
  previewTrait.textContent = trait.label;
  previewHeadline.textContent = segment.title;
  previewCopy.textContent = segment.copy;
  segmentCount.textContent = `Segment ${activeSequenceIndex + 1} / ${trait.sequence.length}`;
  modalTrait.textContent = trait.label;
  modalKicker.textContent = trait.kicker;
  modalHeadline.textContent = segment.title;
  modalCopy.textContent = segment.copy;
  modalSegmentIndex.textContent = `${activeSequenceIndex + 1} / ${trait.sequence.length}`;
  modalProgressLabel.textContent = `Training segment ${activeSequenceIndex + 1} of ${trait.sequence.length}`;
  progressFill.style.width = `${((activeSequenceIndex + 1) / trait.sequence.length) * 100}%`;

  renderTraitSelector();
  renderSequence();
}

function minutesUntilAlarm(alarmTime) {
  const now = new Date();
  const [hours, minutes] = alarmTime.split(":").map(Number);
  const nextAlarm = new Date(now);
  nextAlarm.setHours(hours, minutes, 0, 0);

  if (nextAlarm <= now) {
    nextAlarm.setDate(nextAlarm.getDate() + 1);
  }

  return Math.floor((nextAlarm - now) / 60000);
}

function updateClock() {
  const now = new Date();
  currentDate.textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
  currentTime.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  const minutes = minutesUntilAlarm(alarmTimeInput.value);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  countdownDisplay.textContent = `${hours}h ${remainder}m`;
  alarmReadout.textContent = `Alarm set for ${alarmTimeInput.value}`;
  streakDisplay.textContent = `${12 + tasks.filter((task) => task.done).length} day run`;
}

function generateCalendar() {
  calendarStrip.innerHTML = "";
  const today = new Date();

  for (let offset = -2; offset <= 4; offset += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() + offset);

    const pill = document.createElement("div");
    const isToday = offset === 0;
    pill.className = `calendar-pill${isToday ? " active" : ""}`;
    pill.innerHTML = `
      <span>${day.toLocaleDateString(undefined, { weekday: "short" })}</span>
      <strong>${day.getDate()}</strong>
    `;
    calendarStrip.appendChild(pill);
  }
}

function parseTimeValue(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function renderSchedule() {
  scheduleTimeline.innerHTML = "";
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let nextItem = scheduleItems.find((item) => parseTimeValue(item.start) >= currentMinutes) || scheduleItems[0];

  scheduleItems.forEach((item) => {
    const startMinutes = parseTimeValue(item.start);
    const endMinutes = parseTimeValue(item.end);
    const isActive = currentMinutes >= startMinutes && currentMinutes <= endMinutes;

    const row = document.createElement("div");
    row.className = `timeline-item${isActive ? " active" : ""}`;
    row.innerHTML = `
      <div class="timeline-time">${item.start}</div>
      <div>
        <p class="timeline-title">${item.title}</p>
        <p class="timeline-note">${item.note}</p>
      </div>
    `;
    scheduleTimeline.appendChild(row);
  });

  nextBlockNote.textContent = `Next block begins at ${nextItem.start}`;
}

function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const row = document.createElement("div");
    row.className = `task-row${task.done ? " complete" : ""}`;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "task-toggle";
    toggle.setAttribute("aria-label", `Mark ${task.title} complete`);
    toggle.style.background = task.done ? "var(--accent)" : "transparent";
    toggle.addEventListener("click", () => {
      task.done = !task.done;
      renderTasks();
      updateClock();
    });

    const details = document.createElement("div");
    details.innerHTML = `
      <p class="task-title">${task.title}</p>
      <p class="task-meta">${task.done ? "Completed" : "Queued"} for today's execution cycle.</p>
    `;

    const tag = document.createElement("span");
    tag.className = "task-tag";
    tag.textContent = task.tag;

    row.append(toggle, details, tag);
    taskList.append(row);
  });

  const completed = tasks.filter((task) => task.done).length;
  const score = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  executionScore.textContent = `${score}%`;
  completionCaption.textContent = `${completed} of ${tasks.length} priorities complete today.`;
}

function openModal() {
  activeSequenceIndex = 0;
  applyTrait();
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  activationPaused = false;
  pauseActivation.textContent = "Pause";
  startSequenceLoop();
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  window.clearInterval(activationTimer);
}

function advanceSequence() {
  const trait = getActiveTrait();
  activeSequenceIndex = (activeSequenceIndex + 1) % trait.sequence.length;
  applyTrait();
}

function startSequenceLoop() {
  window.clearInterval(activationTimer);
  activationTimer = window.setInterval(() => {
    if (!activationPaused) {
      advanceSequence();
    }
  }, 4000);
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = taskInput.value.trim();
  if (!title) {
    return;
  }

  tasks = [
    {
      id: Date.now(),
      title,
      tag: taskTag.value,
      done: false
    },
    ...tasks
  ];

  taskInput.value = "";
  renderTasks();
  updateClock();
});

alarmTimeInput.addEventListener("input", updateClock);
launchActivation.addEventListener("click", openModal);
modalClose.addEventListener("click", closeModal);
closeActivation.addEventListener("click", closeModal);
completeActivation.addEventListener("click", closeModal);
nextSegment.addEventListener("click", advanceSequence);
pauseActivation.addEventListener("click", () => {
  activationPaused = !activationPaused;
  pauseActivation.textContent = activationPaused ? "Resume" : "Pause";
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("open")) {
    closeModal();
  }
});

generateCalendar();
renderSchedule();
renderTasks();
applyTrait();
updateClock();
window.setInterval(updateClock, 1000);
window.setInterval(renderSchedule, 60000);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
