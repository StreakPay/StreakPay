-- ============================================================
-- PHASE 3: Daily Activities System
-- ============================================================

-- ============================================================
-- 1. DAILY ACTIVITIES (content bank)
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content JSONB NOT NULL,
  reward_coins INT NOT NULL DEFAULT 10,
  difficulty TEXT NOT NULL DEFAULT 'easy',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active activities"
  ON daily_activities FOR SELECT
  USING (active = true);

-- ============================================================
-- 2. USER ACTIVITY ASSIGNMENTS (maps user to daily activity)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_activity_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES daily_activities(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  user_response JSONB,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, assigned_date)
);

ALTER TABLE user_activity_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assignments"
  ON user_activity_assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assignments"
  ON user_activity_assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assignments"
  ON user_activity_assignments FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. ACTIVITY COMPLETIONS (reward ledger for activities)
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES user_activity_assignments(id) ON DELETE CASCADE,
  streak_id UUID NOT NULL REFERENCES streaks(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  coins_awarded INT NOT NULL DEFAULT 0,
  streak_day INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, assignment_id)
);

ALTER TABLE activity_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions"
  ON activity_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON activity_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. SEED ACTIVITY CONTENT
-- ============================================================

-- Short Stories
INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('short_story', 'The Last Market', 'Read this short story and complete it to earn your daily reward.',
'{"type":"story","story":"The old woman arrived at the market every morning before dawn. Her basket always held exactly seven oranges, each one perfect. One rainy Tuesday, a young boy noticed she never sold any — she just sat there, watching the crowd. When he finally asked why, she smiled and said, I am not here to sell. I am here to remember. She pulled out a faded photograph: the market had been built on the land where her husband once proposed. Some things, she whispered, are worth more than gold. The boy never forgot those words. He returned every Tuesday, until one day, he brought his own seven oranges.","completion_prompt":"What did the old woman come to the market for? Type your answer below.","accepted_answers":["to remember","remember","to remember her husband","memory","remembrance"],"scoring":"contains_any"}',
10, 'easy');

INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('short_story', 'The Coding Cat', 'Read this short story and complete it to earn your daily reward.',
'{"type":"story","story":"Milo was no ordinary cat. While other cats chased mice, Milo chased bugs — software bugs. Every night, when his owner fell asleep at the keyboard, Milo would sneak onto the desk and tap the spacebar exactly three times. Nobody knew why, until the day the code compiled perfectly for the first time in weeks. The three taps had triggered an auto-format command that fixed every indentation error. Milo became the unofficial debugging cat of the office. Programmers would leave treats on his desk, and in return, he would review their code by walking across the keyboard. His pull requests were legendary — always exactly three changes, always correct.","completion_prompt":"What did Milo do every night to help with the code? Type your answer below.","accepted_answers":["tap the spacebar","tapped the spacebar","press the spacebar","three taps","tap spacebar","press spacebar three times"],"scoring":"contains_any"}',
10, 'easy');

INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('short_story', 'The Rainmaker', 'Read this short story and complete it to earn your daily reward.',
'{"type":"story","story":"In a village where rain had not fallen for three years, a stranger arrived carrying only an umbrella. The villagers laughed. We do not need umbrellas here, said the chief. The stranger smiled and opened it upside down. To everyones amazement, water poured out — clear, cool water that filled the village well to the brim. How did you do that? the chief gasped. I collected tears, the stranger replied. From everyone who cried because they had given up hope. The villagers stared in silence. Then the stranger closed the umbrella, and it began to rain. Real rain. For the first time in three years.","completion_prompt":"Where did the stranger say the water came from? Type your answer below.","accepted_answers":["tears","collected tears","from tears","everyone who cried","tears of hope"],"scoring":"contains_any"}',
10, 'easy');

-- Quizzes
INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('quiz', 'General Knowledge', 'Answer today quiz question to earn your daily reward.',
'{"type":"quiz","question":"What is the capital of Nigeria?","options":["Lagos","Abuja","Kano","Port Harcourt"],"correct_answer":"Abuja","explanation":"Abuja has been the capital of Nigeria since 1991, replacing Lagos."}',
10, 'easy');

INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('quiz', 'Science Quiz', 'Answer today quiz question to earn your daily reward.',
'{"type":"quiz","question":"What planet is known as the Red Planet?","options":["Venus","Jupiter","Mars","Saturn"],"correct_answer":"Mars","explanation":"Mars appears red due to iron oxide on its surface."}',
10, 'easy');

INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('quiz', 'Tech Quiz', 'Answer today quiz question to earn your daily reward.',
'{"type":"quiz","question":"What does HTML stand for?","options":["Home Tool Markup Language","HyperText Markup Language","High Tech Modern Language","Hyper Transfer Markup Language"],"correct_answer":"HyperText Markup Language","explanation":"HTML is the standard markup language for creating web pages."}',
10, 'easy');

-- Riddles
INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('riddle', 'Classic Riddle', 'Solve today riddle to earn your daily reward.',
'{"type":"riddle","riddle":"I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?","accepted_answers":["a map","map","globe","atlas"],"hint":"Think about how you navigate places.","explanation":"A map has representations of cities, mountains, and water, but none of the real things."}',
15, 'easy');

INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('riddle', 'Brain Teaser', 'Solve today riddle to earn your daily reward.',
'{"type":"riddle","riddle":"The more you take, the more you leave behind. What am I?","accepted_answers":["footsteps","steps","footprints","footprint"],"hint":"Think about walking.","explanation":"Every step you take leaves a footprint behind."}',
15, 'easy');

INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('riddle', 'Number Riddle', 'Solve today riddle to earn your daily reward.',
'{"type":"riddle","riddle":"What has keys but no locks, space but no room, and you can enter but cannot go inside?","accepted_answers":["keyboard","a keyboard"],"hint":"You use it to type.","explanation":"A keyboard has keys, a space bar, and an enter key."}',
15, 'easy');

-- Math Challenges
INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('math_challenge', 'Quick Math', 'Solve today math challenge to earn your daily reward.',
'{"type":"math","problem":"If a farmer has 17 sheep and all but 9 die, how many sheep are left?","answer":"9","accepted_answers":["9","nine"],"explanation":"All but 9 means 9 survive."}',
10, 'easy');

INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('math_challenge', 'Pattern Math', 'Solve today math challenge to earn your daily reward.',
'{"type":"math","problem":"What comes next: 2, 6, 12, 20, 30, ?","answer":"42","accepted_answers":["42","forty-two","forty two"],"explanation":"The pattern is n(n+1): 1x2=2, 2x3=6, 3x4=12, 4x5=20, 5x6=30, 6x7=42."}',
15, 'medium');

-- Logic Puzzles
INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('logic_puzzle', 'Logic Challenge', 'Solve today logic puzzle to earn your daily reward.',
'{"type":"logic","problem":"A man is looking at a portrait. Someone asks: Whose picture are you looking at? He replies: Brothers and sisters I have none, but that mans father is my fathers son. Who is in the portrait?","accepted_answers":["his son","son","himself","my son"],"hint":"Read carefully: my fathers son — who is that?","explanation":"My fathers son is himself (since he has no siblings). So that mans father is me — the portrait is of his son."}',
20, 'medium');

-- Word Puzzles
INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('word_puzzle', 'Word Scramble', 'Unscramble today word to earn your daily reward.',
'{"type":"word_puzzle","scrambled":"TNREKCIW","hint":"A person who works with metal","accepted_answers":["tinkering","tinker","tinkerer"],"explanation":"The word is TINKERING — the activity of making small repairs or adjustments."}',
15, 'easy');

-- Trivia
INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('trivia', 'World Trivia', 'Answer today trivia question to earn your daily reward.',
'{"type":"trivia","question":"What is the smallest country in the world by area?","options":["Monaco","Vatican City","San Marino","Liechtenstein"],"correct_answer":"Vatican City","explanation":"Vatican City is approximately 0.44 square kilometers."}',
10, 'easy');

INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('trivia', 'Nollywood Trivia', 'Answer today trivia question to earn your daily reward.',
'{"type":"trivia","question":"Which Nigerian movie won an international award in 2020 at the African Movie Academy Awards?","options":["Lionheart","The Wedding Party","October 1","Half of a Yellow Sun"],"correct_answer":"Lionheart","explanation":"Lionheart, directed by Genevieve Nnaji, was Nigerias first Netflix original film."}',
10, 'easy');

-- Reflections
INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('reflection', 'Daily Reflection', 'Share your thoughts to earn your daily reward.',
'{"type":"reflection","prompt":"What is one thing you are grateful for today?","min_words":5,"explanation":"Gratitude practice helps build a positive mindset."}',
10, 'easy');

-- Daily Polls
INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('daily_poll', 'Quick Poll', 'Vote in today poll to earn your daily reward.',
'{"type":"poll","question":"What is the best time of day to learn something new?","options":["Early Morning","Afternoon","Evening","Late Night"],"explanation":"Everyone has different peak learning times. The best time is when you feel most alert!"}',
5, 'easy');

-- Pattern Recognition
INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('pattern_recognition', 'Pattern Match', 'Find the pattern to earn your daily reward.',
'{"type":"pattern","sequence":["red","blue","red","blue","red","?"],"options":["red","blue","yellow","green"],"correct_answer":"blue","accepted_answers":["blue"],"explanation":"The pattern alternates between red and blue."}',
10, 'easy');

-- Memory Challenge
INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('memory_challenge', 'Memory Test', 'Complete today memory challenge to earn your reward.',
'{"type":"memory","items":["apple","flower","star","moon","fire"],"display_time":5,"question":"Which item was in position 3?","options":["apple","flower","star","moon"],"correct_answer":"star","explanation":"The third item in the sequence was the star."}',
15, 'medium');

-- Engineering Questions
INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('engineering_question', 'Engineering Challenge', 'Answer today engineering question to earn your reward.',
'{"type":"engineering","question":"What force keeps planets in orbit around the Sun?","options":["Magnetic Force","Nuclear Force","Gravity","Friction"],"correct_answer":"Gravity","explanation":"Gravity is the force of attraction between objects with mass."}',
10, 'easy');

-- Science Questions
INSERT INTO daily_activities (activity_type, title, description, content, reward_coins, difficulty) VALUES
('science_question', 'Science Fact', 'Answer today science question to earn your reward.',
'{"type":"science","question":"What gas do plants absorb from the atmosphere during photosynthesis?","options":["Oxygen","Nitrogen","Carbon Dioxide","Hydrogen"],"correct_answer":"Carbon Dioxide","explanation":"Plants absorb CO2 and use sunlight to convert it into glucose and oxygen."}',
10, 'easy');
