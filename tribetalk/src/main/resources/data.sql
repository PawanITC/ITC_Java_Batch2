-- Users
INSERT INTO users (username, email, password) VALUES ('alice', 'alice@example.com', 'password123');
INSERT INTO users (username, email, password) VALUES ('bob', 'bob@example.com', 'password123');
INSERT INTO users (username, email, password) VALUES ('charlie', 'charlie@example.com', 'password123');

-- Authorities
INSERT INTO authorities (authority, user_id) VALUES ('ROLE_USER', 1);
INSERT INTO authorities (authority, user_id) VALUES ('ROLE_ADMIN', 1);
INSERT INTO authorities (authority, user_id) VALUES ('ROLE_USER', 2);
INSERT INTO authorities (authority, user_id) VALUES ('ROLE_USER', 3);
