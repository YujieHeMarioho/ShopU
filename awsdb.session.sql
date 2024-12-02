CREATE TABLE communities (
  community_id BIGINT,
  name VARCHAR(255),
  description VARCHAR(255)
);

CREATE TABLE community_members (
  community_id BIGINT,
  user_id INT,
  joined_at TIMESTAMP
);