// ===================================================================
//  QUIZ QUESTIONS  —  THIS IS THE ONLY FILE YOU NEED TO EDIT
//
//  Every "TODO" below is a placeholder. Swap in your real questions and
//  answers. Nothing else in the quiz needs changing — add or remove
//  questions freely and the scoring adapts to however many there are.
//
//  Two kinds of question:
//
//  1. { type: "choice", ... }  — tap the right answer.
//       correct: index of the right option (0 = first, 1 = second, …).
//
//  2. { type: "order", ... }   — put events in the right order.
//       items: listed in the CORRECT order, earliest first. The quiz
//       shuffles them for the guest and gives partial credit for
//       partly-right orderings.
//
//  "note" is shown after they answer — that's where the story goes.
//  It's optional; delete the line if you don't want one.
//
//  Photos come in two kinds, and the difference matters:
//
//    askPhotos / askCaption       — shown WITH the question, always. Only use
//                                   these when the photo doesn't give the
//                                   answer away, e.g. the question already
//                                   says where you were.
//    answerPhotos / answerCaption — shown with the ANSWER, so they stay hidden
//                                   until you release the answers.
//
//  Each takes one or two entries. An entry is either a plain path:
//      askPhotos: ["photos/a.jpg", "photos/b.jpg"]
//  or an object, to caption that one photo on its own:
//      answerPhotos: [{ src: "photos/a.jpg", caption: "A stop in Chicago." }]
//  askCaption / answerCaption caption the pair as a whole instead.
//
//  Drop files in photos/ and keep them under ~300KB so they load fast on
//  brewery wifi — ask and I'll resize anything.
// ===================================================================

const QUIZ_TITLE = "How well do you know us?";

const QUIZ_INTRO =
  "A few questions about us. No prizes, no pressure, mild public shame. " +
  "Put your name in at the end to land on the leaderboard.";

const QUESTIONS = [
  {
    type: "choice",
    // "What did we get" rather than "what did we do" — they also walked through
    // Washington Square Park that night, so a "what did we do" question has
    // more than one true answer. All four options are food for the same reason.
    question: "Our first date took us to a bar near NYU. What did we get after?",
    options: [
      "Insomnia Cookies",
      "A slice at Joe's Pizza",
      "Falafel from Mamoun's",
      "Halal Guys",
    ],
    correct: 0,
    // The photos are of the bar, and the question already says we were at a
    // bar — so they can sit with the question and give nothing away.
    askPhotos: [
      "photos/first_date/first-date-1.jpg",
      "photos/first_date/first-date-2.jpg",
    ],
    askCaption: "The bar in question — though these are from a much later visit.",
    note: "Washington Square Park first, then the bar, then Insomnia Cookies.",
  },
  {
    type: "choice",
    question: "Who said “I love you” first?",
    options: [
      "Alex",
      "Amanda",
      "We said it at the same time",
      "Neither — we still haven't said it",
    ],
    correct: 0,
    note: "Amanda felt it first. Alex said it out loud so she wouldn't have to 😉",
  },
  {
    type: "choice",
    question: "Which line from Alex's bio hooked Amanda?",
    options: [
      "“Let's share secrets”",
      "“I'm 6 ft with heels on”",
      "“I peaked at trivia night”",
      "“I have a big heart”",
    ],
    correct: 0,
    note: "Four words — “let's share secrets” — and Amanda decided that was worth a reply.",
  },
  {
    type: "order",
    question: "Put our story in order — earliest first.",
    items: [
      "Our first date in New York",
      "Amanda drives across the country to California",
      "We move in together in South San Francisco",
      "The proposal",
    ],
    note: "New York to San Francisco, in that order — about six years of it.",
    // Held back until the answers are released: the photos give away which
    // milestone came where.
    answerPhotos: [
      {
        src: "photos/timeline/timeline-drive.jpg",
        caption: "A stop outside Chicago.",
      },
      {
        src: "photos/timeline/timeline-apartment.jpg",
        caption: "Moving in is hard — taking a break with a much-needed Claw.",
      },
    ],
  },
  {
    type: "choice",
    // "Active" on purpose — there are retired Giants we like more.
    question: "Who's our favorite active San Francisco Giants player?",
    options: [
      "Jung Hoo Lee",
      "Logan Webb",
      "Willy Adames",
      "Luis Arraez",
    ],
    correct: 0,
    note: "Jung Hoo Lee, and it isn't close.",
  },
  {
    type: "choice",
    question: "Where did the proposal happen?",
    options: [
      "Gantry Park, Queens NY",
      // Not a throwaway: this was genuinely the runner-up.
      "Brooklyn Bridge Park, Brooklyn NY",
      "Golden Gate Park, San Francisco CA",
      "The bar from our first date, Manhattan NY",
    ],
    correct: 0,
    note:
      "Alex talked her into visiting the park a month ahead, claiming he'd seen " +
      "it in an Instagram reel. Amanda was briefly suspicious — Alex doesn't " +
      "plan things — and then forgot all about it. Edelyn and Sarah took her to " +
      "get her nails done a few days before the trip, so she was ready for the " +
      "ring photo without knowing why. She said no at first, purely out of " +
      "disbelief and horror at doing this in public. Once the photographer left " +
      "and the clapping strangers wandered off, she cried and called everyone " +
      "she loves. Brooklyn Bridge Park was the runner-up — one of our early " +
      "dates.",
    answerPhotos: [
      {
        src: "photos/pretend_proposal/pretend-proposal.jpg",
        caption:
          "Alex fake-proposing in Prospect Park on 13 May 2021, almost five " +
          "years to the day before the real one. Who said Alex is a bad " +
          "planner? 😉",
      },
    ],
  },
  {
    type: "choice",
    question: "What is Alex’s most annoying habit, according to Amanda?", // TODO
    options: ["TODO", "TODO", "TODO", "TODO"],
    correct: 0,
  },
  {
    type: "order",
    question: "Order these places we’ve traveled — first trip to most recent.",
    items: [
      "TODO — place 1",
      "TODO — place 2",
      "TODO — place 3",
      "TODO — place 4",
    ],
  },
  {
    type: "choice",
    question: "What song is unavoidably “our song”?", // TODO
    options: ["TODO", "TODO", "TODO", "TODO"],
    correct: 0,
    note: "TODO",
  },
  {
    type: "choice",
    question: "How long have we been together, as of the party?", // TODO
    options: ["TODO years", "TODO years", "TODO years", "TODO years"],
    correct: 0,
    note: "TODO",
  },
];

// Shown based on the percentage scored. Keep these in descending order.
const SCORE_TIERS = [
  { min: 90, label: "Suspiciously well informed", blurb: "Were you taking notes this whole time?" },
  { min: 70, label: "Certified inner circle", blurb: "You’ve clearly been paying attention. We noticed." },
  { min: 50, label: "Solid acquaintance", blurb: "You know the highlights. Come find us for the rest." },
  { min: 25, label: "Here for the free food", blurb: "Honestly, respect. Go grab a drink." },
  { min: 0, label: "Who invited you?", blurb: "Kidding. Mostly. Let’s fix this at the party." },
];
