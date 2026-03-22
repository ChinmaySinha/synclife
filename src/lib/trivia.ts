export type TriviaQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  funFact: string;
};

export const triviaBank: TriviaQuestion[] = [
  {
    question: "What is the longest river in the world?",
    options: ["Amazon", "Nile", "Yangtze", "Mississippi"],
    correctIndex: 1,
    funFact: "The Nile stretches about 6,650 km through 11 countries!"
  },
  {
    question: "Which planet has the most moons?",
    options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
    correctIndex: 1,
    funFact: "Saturn has 146 known moons — more than any other planet!"
  },
  {
    question: "What is the hardest natural substance on Earth?",
    options: ["Gold", "Iron", "Diamond", "Platinum"],
    correctIndex: 2,
    funFact: "Diamonds are so hard they can only be scratched by other diamonds!"
  },
  {
    question: "Which country has the most time zones?",
    options: ["Russia", "USA", "France", "China"],
    correctIndex: 2,
    funFact: "France has 12 time zones due to its overseas territories!"
  },
  {
    question: "How many bones does an adult human have?",
    options: ["186", "206", "256", "300"],
    correctIndex: 1,
    funFact: "Babies are born with about 270 bones — some fuse as they grow!"
  },
  {
    question: "What is the smallest country in the world?",
    options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
    correctIndex: 1,
    funFact: "Vatican City is only 0.44 km² — smaller than most golf courses!"
  },
  {
    question: "Which ocean is the deepest?",
    options: ["Atlantic", "Indian", "Pacific", "Arctic"],
    correctIndex: 2,
    funFact: "The Mariana Trench in the Pacific reaches 11,034 meters deep!"
  },
  {
    question: "What gas makes up most of Earth's atmosphere?",
    options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
    correctIndex: 2,
    funFact: "Nitrogen makes up about 78% of our atmosphere!"
  },
  {
    question: "Which animal has the longest lifespan?",
    options: ["Elephant", "Bowhead whale", "Giant tortoise", "Greenland shark"],
    correctIndex: 3,
    funFact: "Greenland sharks can live over 400 years — born before Shakespeare!"
  },
  {
    question: "How many hearts does an octopus have?",
    options: ["1", "2", "3", "4"],
    correctIndex: 2,
    funFact: "Two pump blood to the gills, one pumps it to the rest of the body!"
  },
  {
    question: "What is the speed of light?",
    options: ["150,000 km/s", "300,000 km/s", "500,000 km/s", "1,000,000 km/s"],
    correctIndex: 1,
    funFact: "Light can travel around Earth 7.5 times in just one second!"
  },
  {
    question: "Which element has the chemical symbol 'Au'?",
    options: ["Silver", "Aluminum", "Gold", "Argon"],
    correctIndex: 2,
    funFact: "Au comes from 'aurum', the Latin word for gold!"
  },
  {
    question: "What is the largest desert in the world?",
    options: ["Sahara", "Antarctic", "Arabian", "Gobi"],
    correctIndex: 1,
    funFact: "Antarctica is technically the largest desert — very little precipitation!"
  },
  {
    question: "Which language has the most native speakers?",
    options: ["English", "Mandarin Chinese", "Spanish", "Hindi"],
    correctIndex: 1,
    funFact: "Over 920 million people speak Mandarin as their first language!"
  },
  {
    question: "What is the tallest mountain in the solar system?",
    options: ["Mount Everest", "Olympus Mons", "Mauna Kea", "K2"],
    correctIndex: 1,
    funFact: "Olympus Mons on Mars is about 21.9 km tall — 2.5x Everest!"
  },
  {
    question: "How many teeth does an adult human typically have?",
    options: ["28", "30", "32", "36"],
    correctIndex: 2,
    funFact: "Including wisdom teeth! Many people have some removed though."
  },
  {
    question: "What percentage of Earth's surface is covered by water?",
    options: ["51%", "61%", "71%", "81%"],
    correctIndex: 2,
    funFact: "But only about 3% of that water is fresh water!"
  },
  {
    question: "Which bird can fly backwards?",
    options: ["Eagle", "Hummingbird", "Sparrow", "Penguin"],
    correctIndex: 1,
    funFact: "Hummingbirds can fly backwards, upside down, and hover in place!"
  },
  {
    question: "What is the most abundant metal in Earth's crust?",
    options: ["Iron", "Copper", "Aluminum", "Gold"],
    correctIndex: 2,
    funFact: "Aluminum makes up about 8% of Earth's crust by weight!"
  },
  {
    question: "How long does it take light from the Sun to reach Earth?",
    options: ["1 minute", "8 minutes", "30 minutes", "1 hour"],
    correctIndex: 1,
    funFact: "About 8 minutes and 20 seconds — so you see the Sun as it was 8 min ago!"
  },
];

/**
 * Get a deterministic daily trivia question (same question all day, changes at midnight)
 */
export function getDailyTrivia(): TriviaQuestion {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return triviaBank[dayOfYear % triviaBank.length];
}
