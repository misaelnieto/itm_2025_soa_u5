-- Drop the leaderboard table first because it references sessions
DROP TABLE IF EXISTS leaderboard;

-- Drop the trigger before dropping the sessions table
DROP TRIGGER IF EXISTS set_timestamp;

-- Drop the sessions table last
DROP TABLE IF EXISTS sessions;