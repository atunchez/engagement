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
//  "images" is an optional list of one or two photo paths, shown with the
//  answer. "caption" is an optional line underneath them. Both only appear
//  once you've released the answers — a photo would otherwise give it away.
//  Drop files in photos/ and keep them under ~300KB so they load fast on
//  brewery wifi; ask and I'll resize anything.
// ===================================================================

const QUIZ_TITLE = "How well do you know us?";

const QUIZ_INTRO =
  "A few questions about us. No prizes, no pressure, mild public shame. " +
  "Put your name in at the end to land on the leaderboard.";

const QUESTIONS = [
  {
    type: "choice",
    question: "What did we get after our first date?",
    options: [
      "Insomnia Cookies",
      "Levain Bakery",
      "Halal Guys",
      "Big Gay Ice Cream",
    ],
    correct: 0,
    note:
      "A bar near NYU first, then Insomnia Cookies. " +
      "TODO — add a line about that night in your own words.",
    images: [
      "photos/first_date/first-date-1.jpg",
      "photos/first_date/first-date-2.jpg",
    ],
    caption: "Same bar, same booth — photographed on a much later visit.",
  },
  {
    type: "choice",
    question: "Who said “I love you” first?", // TODO
    options: [
      "Alex",
      "Amanda",
      "We said it at the same time",
      "Neither — it was over text",
    ],
    correct: 0, // TODO
    note: "TODO — the story.",
  },
  {
    type: "choice",
    question: "How did we actually meet?", // TODO
    options: [
      "TODO — the truth",
      "TODO — a dating app",
      "TODO — through a mutual friend",
      "TODO — at work",
    ],
    correct: 0,
    note: "TODO",
  },
  {
    type: "order",
    question: "Put our story in order — earliest first.",
    items: [
      "The night we met", // TODO
      "Our first date", // TODO
      "The first trip we took together", // TODO
      "Moving in together", // TODO
      "The proposal", // TODO
    ],
    note: "TODO — a line about the stretch between the first and last of these.",
  },
  {
    type: "choice",
    question: "Which one of us is genuinely the better cook?", // TODO
    options: [
      "Alex",
      "Amanda",
      "Neither — we order in",
      "Depends entirely on the dish",
    ],
    correct: 1, // TODO
    note: "TODO",
  },
  {
    type: "choice",
    question: "Where did the proposal happen?", // TODO
    options: ["TODO", "TODO", "TODO", "TODO"],
    correct: 0,
    note: "TODO",
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
