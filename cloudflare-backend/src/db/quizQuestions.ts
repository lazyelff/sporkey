// Quiz Questions Seeder
// Run this to populate the quiz_questions table

export const quizQuestions = [
  // EASY QUESTIONS (15 XP each)
  { question: "How many players are on a football team on the field?", optionA: "9", optionB: "11", optionC: "13", optionD: "15", correctAnswer: "B", difficulty: "easy", category: "rules" },
  { question: "What color card means a player is sent off?", optionA: "Yellow", optionB: "Green", optionC: "Red", optionD: "Blue", correctAnswer: "C", difficulty: "easy", category: "rules" },
  { question: "How long is a standard football match?", optionA: "60 min", optionB: "90 min", optionC: "120 min", optionD: "75 min", correctAnswer: "B", difficulty: "easy", category: "rules" },
  { question: "What is a goal kick?", optionA: "Kick from the corner", optionB: "Kick from the penalty spot", optionC: "Kick from inside the goal area", optionD: "Kick from the center circle", correctAnswer: "C", difficulty: "easy", category: "rules" },
  { question: "How many minutes is each half in football?", optionA: "40", optionB: "45", optionC: "50", optionD: "35", correctAnswer: "B", difficulty: "easy", category: "rules" },
  { question: "What happens if a player gets two yellow cards?", optionA: "Nothing", optionB: "Warning", optionC: "Red card", optionD: "Penalty", correctAnswer: "C", difficulty: "easy", category: "rules" },
  { question: "Which side wins the coin toss before a match?", optionA: "Home team", optionB: "Away team", optionC: "Winner chooses", optionD: "Captain", correctAnswer: "C", difficulty: "easy", category: "rules" },
  { question: "What is the offside rule about?", optionA: "Being too far from play", optionB: "Being ahead of the ball", optionC: "Being behind the last defender", optionD: "Being out of bounds", correctAnswer: "C", difficulty: "easy", category: "rules" },
  { question: "How many substitute players are allowed in most matches?", optionA: "3", optionB: "5", optionC: "7", optionD: "2", correctAnswer: "B", difficulty: "easy", category: "rules" },
  { question: "What is the center circle used for?", optionA: "Free kicks only", optionB: "Kick-off", optionC: "Penalty shootouts", optionD: "Goal kicks", correctAnswer: "B", difficulty: "easy", category: "rules" },
  { question: "Which country is known as the birthplace of football?", optionA: "Brazil", optionB: "Spain", optionC: "England", optionD: "Italy", correctAnswer: "C", difficulty: "easy", category: "history" },
  { question: "What sport uses the terms 'hat-trick' and 'penalty'?", optionA: "Basketball", optionB: "Tennis", optionC: "Football", optionD: "Golf", correctAnswer: "C", difficulty: "easy", category: "rules" },
  { question: "What is the main object of football?", optionA: "Keep the ball", optionB: "Score goals", optionC: "Run fast", optionD: "Kick high", correctAnswer: "B", difficulty: "easy", category: "rules" },
  { question: "How many halves are in a football match?", optionA: "1", optionB: "2", optionC: "3", optionD: "4", correctAnswer: "B", difficulty: "easy", category: "rules" },
  { question: "What is extra time?", optionA: "Overtime after a draw", optionB: "Warm-up period", optionC: "Half-time break", optionD: "Injury time", correctAnswer: "A", difficulty: "easy", category: "rules" },
  
  // MEDIUM QUESTIONS (25 XP each)
  { question: "Who won the 2018 FIFA World Cup?", optionA: "Germany", optionB: "Brazil", optionC: "France", optionD: "Argentina", correctAnswer: "C", difficulty: "medium", category: "history" },
  { question: "Which club has won the most Champions League titles?", optionA: "Barcelona", optionB: "Real Madrid", optionC: "Bayern", optionD: "AC Milan", correctAnswer: "B", difficulty: "medium", category: "history" },
  { question: "What is a hat-trick?", optionA: "2 goals", optionB: "3 goals", optionC: "4 goals", optionD: "5 goals", correctAnswer: "B", difficulty: "medium", category: "rules" },
  { question: "Which player has won the most Ballon d'Or awards?", optionA: "Cristiano Ronaldo", optionB: "Lionel Messi", optionC: "Michel Platini", optionD: "Johan Cruyff", correctAnswer: "B", difficulty: "medium", category: "players" },
  { question: "In which year was the Premier League founded?", optionA: "1990", optionB: "1992", optionC: "1994", optionD: "1996", correctAnswer: "B", difficulty: "medium", category: "history" },
  { question: "Which country has won the most World Cups?", optionA: "Germany", optionB: "Argentina", optionC: "Italy", optionD: "Brazil", correctAnswer: "D", difficulty: "medium", category: "history" },
  { question: "What does 'MLS' stand for?", optionA: "Major League Soccer", optionB: "Modern League System", optionC: "Master League Series", optionD: "Metropolitan League Select", correctAnswer: "A", difficulty: "medium", category: "stats" },
  { question: "Who is the all-time top scorer in the Premier League?", optionA: "Wayne Rooney", optionB: "Alan Shearer", optionC: "Harry Kane", optionD: "Thierry Henry", correctAnswer: "B", difficulty: "medium", category: "stats" },
  { question: "Which club is known as 'The Red Devils'?", optionA: "Liverpool", optionB: "Manchester United", optionC: "Chelsea", optionD: "Arsenal", correctAnswer: "B", difficulty: "medium", category: "history" },
  { question: "What is the capacity of Camp Nou?", optionA: "99,000", optionB: "80,000", optionC: "75,000", optionD: "90,000", correctAnswer: "D", difficulty: "medium", category: "stats" },
  { question: "Which player is known as 'CR7'?", optionA: "Lionel Messi", optionB: "Cristiano Ronaldo", optionC: "Neymar Jr", optionD: "Kylian Mbappé", correctAnswer: "B", difficulty: "medium", category: "players" },
  { question: "What year did the first World Cup take place?", optionA: "1930", optionB: "1934", optionC: "1938", optionD: "1924", correctAnswer: "A", difficulty: "medium", category: "history" },
  { question: "Which club won the first Champions League?", optionA: "Real Madrid", optionB: "Benfica", optionC: "AC Milan", optionD: "Bayern Munich", correctAnswer: "A", difficulty: "medium", category: "history" },
  { question: "What is 'La Liga'?", optionA: "Italian league", optionB: "English league", optionC: "Spanish league", optionD: "French league", correctAnswer: "C", difficulty: "medium", category: "history" },
  { question: "Who won the 2022 FIFA World Cup?", optionA: "France", optionB: "Brazil", optionC: "Argentina", optionD: "Germany", correctAnswer: "C", difficulty: "medium", category: "history" },
  
  // HARD QUESTIONS (40 XP each)
  { question: "In which year was VAR first used in the World Cup?", optionA: "2014", optionB: "2016", optionC: "2018", optionD: "2022", correctAnswer: "C", difficulty: "hard", category: "history" },
  { question: "Who scored the 'Hand of God' goal?", optionA: "Pelé", optionB: "Maradona", optionC: "Messi", optionD: "Zidane", correctAnswer: "B", difficulty: "hard", category: "players" },
  { question: "Which country has never missed a World Cup?", optionA: "Germany", optionB: "Argentina", optionC: "Brazil", optionD: "Italy", correctAnswer: "C", difficulty: "hard", category: "history" },
  { question: "Who holds the record for most goals in a single Champions League season?", optionA: "Cristiano Ronaldo", optionB: "Lionel Messi", optionC: "Robert Lewandowski", optionD: "Karim Benzema", correctAnswer: "B", difficulty: "hard", category: "stats" },
  { question: "In what year did the 'Bosman ruling' happen?", optionA: "1990", optionB: "1995", optionC: "1992", optionD: "1988", correctAnswer: "B", difficulty: "hard", category: "history" },
  { question: "Which player has played the most professional matches?", optionA: "Peter Shilton", optionB: "Ryan Giggs", optionC: "Paolo Maldini", optionD: "Steven Gerrard", correctAnswer: "A", difficulty: "hard", category: "stats" },
  { question: "Who was the first African player to win the Ballon d'Or?", optionA: "Didier Drogba", optionB: "George Weah", optionC: "Samuel Eto'o", optionD: "Yaya Touré", correctAnswer: "B", difficulty: "hard", category: "players" },
  { question: "What was the score of the famous 2005 Champions League final?", optionA: "3-3", optionB: "2-2", optionC: "4-4", optionD: "1-1", correctAnswer: "A", difficulty: "hard", category: "history" },
  { question: "Which club has the most domestic league titles in England?", optionA: "Manchester United", optionB: "Liverpool", optionC: "Arsenal", optionD: "Manchester City", correctAnswer: "A", difficulty: "hard", category: "history" },
  { question: "Who is the only player to win the World Cup as both player and manager?", optionA: "Franz Beckenbauer", optionB: "Mario Zagallo", optionC: "Gerd Müller", optionD: "Paolo Maldini", correctAnswer: "B", difficulty: "hard", category: "players" },
  { question: "What is the youngest goalscorer in World Cup history?", optionA: "Pelé", optionB: "Kylian Mbappé", optionC: "Diego Maradona", optionD: "Lionel Messi", correctAnswer: "A", difficulty: "hard", category: "stats" },
  { question: "Which club won the first ever FA Cup?", optionA: "Manchester United", optionB: "Chelsea", optionC: "Wanderers", optionD: "Blackburn Rovers", correctAnswer: "C", difficulty: "hard", category: "history" },
  { question: "Who scored the fastest goal in World Cup history?", optionA: "Cristiano Ronaldo", optionB: "Hakan Şükür", optionC: "Just Fontaine", optionD: "Gerd Müller", correctAnswer: "B", difficulty: "hard", category: "stats" },
  { question: "Which player has the most appearances for a single club?", optionA: "Paolo Maldini", optionB: "Ryan Giggs", optionC: "Xavi", optionD: "Steven Gerrard", correctAnswer: "A", difficulty: "hard", category: "stats" },
  { question: "What year was the Champions League renamed from the European Cup?", optionA: "1990", optionB: "1992", optionC: "1994", optionD: "1996", correctAnswer: "B", difficulty: "hard", category: "history" },
];

export default quizQuestions;
