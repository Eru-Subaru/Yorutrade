PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE listings (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  have TEXT NOT NULL,
  want TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('goods', 'pick')),
  event TEXT NOT NULL,
  notes TEXT NOT NULL,
  have_normalized TEXT NOT NULL,
  want_normalized TEXT NOT NULL,
  event_normalized TEXT NOT NULL,
  image_id TEXT UNIQUE REFERENCES images(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'matched', 'withdrawn')),
  created_at INTEGER NOT NULL
);
CREATE TABLE r2_cleanup (
  object_key TEXT PRIMARY KEY
);
CREATE TRIGGER queue_deleted_image AFTER DELETE ON images
BEGIN
  INSERT OR IGNORE INTO r2_cleanup(object_key) VALUES (OLD.object_key);
END;
CREATE INDEX listings_active ON listings(status, created_at DESC);
CREATE INDEX listings_owner ON listings(owner_id, status);
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  initiator_id TEXT NOT NULL REFERENCES users(id),
  recipient_id TEXT NOT NULL REFERENCES users(id),
  listing_id TEXT NOT NULL REFERENCES listings(id),
  offered_listing_id TEXT NOT NULL REFERENCES listings(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined')),
  created_at INTEGER NOT NULL,
  CHECK(initiator_id <> recipient_id),
  CHECK(listing_id <> offered_listing_id)
);
CREATE UNIQUE INDEX matches_unique_pair ON matches(
  min(listing_id, offered_listing_id), max(listing_id, offered_listing_id)
);
CREATE INDEX matches_initiator ON matches(initiator_id, created_at DESC);
CREATE INDEX matches_recipient ON matches(recipient_id, created_at DESC);
CREATE TRIGGER accept_available_match BEFORE UPDATE OF status ON matches
WHEN NEW.status = 'accepted' AND OLD.status = 'pending'
BEGIN
  SELECT CASE WHEN (
    SELECT count(*) FROM listings
    WHERE id IN (NEW.listing_id, NEW.offered_listing_id) AND status = 'active'
      AND created_at > unixepoch('now') * 1000 - 2592000000
  ) <> 2 THEN RAISE(ABORT, 'listings_unavailable') END;
END;
CREATE TRIGGER reserve_accepted_listings AFTER UPDATE OF status ON matches
WHEN NEW.status = 'accepted' AND OLD.status = 'pending'
BEGIN
  UPDATE listings SET status = 'matched' WHERE id IN (NEW.listing_id, NEW.offered_listing_id);
  UPDATE matches SET status = 'declined'
  WHERE id <> NEW.id AND status = 'pending' AND (
    listing_id IN (NEW.listing_id, NEW.offered_listing_id) OR
    offered_listing_id IN (NEW.listing_id, NEW.offered_listing_id)
  );
END;
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id),
  sender_id TEXT NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX messages_match ON messages(match_id, created_at, id);
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX rate_limits_expiry ON rate_limits(expires_at);
