// ============================================================
// Hard-coded question bank — used for Daily Question feature
// ============================================================

export const DAILY_QUESTIONS = [
  // Memories & Past
  { question: "What's your favourite memory of us together?", category: "MEMORIES" },
  { question: "What was the moment you knew you were falling for me?", category: "MEMORIES" },
  { question: "What's the most embarrassing thing we've done together?", category: "MEMORIES" },
  { question: "Describe our first date in three words.", category: "MEMORIES" },
  { question: "What trip have we taken that you'd love to relive?", category: "MEMORIES" },

  // Dreams & Future
  { question: "Where would you love us to live in 10 years?", category: "FUTURE" },
  { question: "Name one bucket list item you want us to check off this year.", category: "FUTURE" },
  { question: "What kind of home do you want us to build together?", category: "FUTURE" },
  { question: "What's a goal you want us to achieve as a couple?", category: "FUTURE" },
  { question: "If you could fast-forward 5 years, what would you hope to see?", category: "FUTURE" },

  // Personality & Preferences
  { question: "What's one habit of mine that secretly makes you smile?", category: "PERSONALITY" },
  { question: "What do I do that shows you I love you most?", category: "PERSONALITY" },
  { question: "What's my love language? Do you think I've got yours figured out?", category: "PERSONALITY" },
  { question: "What quality of mine do you admire most?", category: "PERSONALITY" },
  { question: "What's something you wish I knew about how you like to be loved?", category: "PERSONALITY" },

  // Fun & Random
  { question: "If we were a movie genre, what would we be?", category: "FUN" },
  { question: "What song do you think describes our relationship perfectly?", category: "FUN" },
  { question: "If we could eat only one food for the rest of our lives, what would you pick?", category: "FUN" },
  { question: "What superpower would suit me best?", category: "FUN" },
  { question: "If our relationship had a theme park, what rides would it have?", category: "FUN" },
  { question: "What TV couple reminds you of us?", category: "FUN" },

  // Gratitude & Appreciation
  { question: "What's something I did recently that made your day better?", category: "GRATITUDE" },
  { question: "What's the little thing I do that means the most to you?", category: "GRATITUDE" },
  { question: "What are you most grateful for about our relationship?", category: "GRATITUDE" },
  { question: "What's a way I've helped you grow as a person?", category: "GRATITUDE" },
  { question: "What moment in our relationship are you most proud of?", category: "GRATITUDE" },

  // Deep & Thoughtful
  { question: "What's something you've never told me but want to share today?", category: "DEEP" },
  { question: "What fear have I helped you overcome?", category: "DEEP" },
  { question: "How have I changed you for the better?", category: "DEEP" },
  { question: "What does home feel like to you, and does being with me feel like home?", category: "DEEP" },
  { question: "If you could give our relationship one superpower, what would it be?", category: "DEEP" },
];

// ============================================================
// Would You Rather questions for the game feature
// ============================================================

export const WOULD_YOU_RATHER = [
  { question: "Would you rather...", optionA: "Have a surprise date every week", optionB: "Have one perfect date a month" },
  { question: "Would you rather...", optionA: "Travel to 10 new countries together", optionB: "Revisit your favourite place every year" },
  { question: "Would you rather...", optionA: "Be able to read each other's minds", optionB: "Always know what the other is feeling" },
  { question: "Would you rather...", optionA: "Live in a cosy cabin in the mountains", optionB: "Live in a penthouse in the city" },
  { question: "Would you rather...", optionA: "Cook every meal together at home", optionB: "Try a new restaurant every week" },
  { question: "Would you rather...", optionA: "Dance in the rain with me", optionB: "Watch the sunset together every evening" },
  { question: "Would you rather...", optionA: "Know exactly when we'll meet in life", optionB: "Experience meeting for the first time again" },
  { question: "Would you rather...", optionA: "Go on an adventure holiday", optionB: "Have a luxury relaxation holiday" },
  { question: "Would you rather...", optionA: "Always have the perfect thing to say", optionB: "Always know the perfect gift to give" },
  { question: "Would you rather...", optionA: "Have a magical wedding", optionB: "Have an unforgettable honeymoon" },
];

export const COUPLES_QUIZ: { question: string; answer: string }[] = [
  { question: "What is my comfort food?", answer: "" },
  { question: "What is my biggest pet peeve?", answer: "" },
  { question: "What was I wearing when we first met?", answer: "" },
  { question: "What is my dream holiday destination?", answer: "" },
  { question: "What is my favourite movie of all time?", answer: "" },
  { question: "What is my most-used emoji?", answer: "" },
  { question: "What is my morning routine like?", answer: "" },
  { question: "What song always puts me in a good mood?", answer: "" },
  { question: "What is the first thing I notice about a person?", answer: "" },
  { question: "What am I most afraid of?", answer: "" },
];

export const TRUTH_OR_DARE = [
  { question: "Truth: What is the most adventurous thing you want us to do together?", optionA: "Truth", optionB: "Dare" },
  { question: "Dare: Send your partner the most heartfelt voice note right now.", optionA: "Truth", optionB: "Dare" },
  { question: "Truth: What is one thing I do that you find irresistible?", optionA: "Truth", optionB: "Dare" },
  { question: "Dare: Write your partner a 3-sentence love letter in the chat.", optionA: "Truth", optionB: "Dare" },
  { question: "Truth: What is your favourite thing we do together?", optionA: "Truth", optionB: "Dare" },
  { question: "Dare: Tell your partner three things you love about them right now.", optionA: "Truth", optionB: "Dare" },
  { question: "Truth: When did you first realise you wanted to be with me?", optionA: "Truth", optionB: "Dare" },
  { question: "Dare: Plan a surprise date for us in the next 7 days.", optionA: "Truth", optionB: "Dare" },
];

export type GameQuestions = typeof WOULD_YOU_RATHER;
