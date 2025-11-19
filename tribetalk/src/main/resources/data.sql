-- Users
INSERT INTO users (id, username, email, password,displayname,followers_count,following_count) VALUES (1,'alice', 'alice@example.com', '$2a$10$NN/RJ/8VLXnI3oJDQV4uU.zGheYWkBdTFVajap41mMCGkj4sQuBwK','Alice',0,0);
INSERT INTO users (id, username, email, password,displayname,followers_count,following_count) VALUES (2,'bob', 'bob@example.com', '$2a$10$NN/RJ/8VLXnI3oJDQV4uU.zGheYWkBdTFVajap41mMCGkj4sQuBwK','Bob',0,0);
INSERT INTO users (id, username, email, password,displayname,followers_count,following_count) VALUES (3,'charlie', 'charlie@example.com', '$2a$10$NN/RJ/8VLXnI3oJDQV4uU.zGheYWkBdTFVajap41mMCGkj4sQuBwK','Charlie',0,0);
INSERT INTO users (id, username, email, password,displayname,followers_count,following_count) VALUES (4,'rahisarm', 'rahis@example.com','$2a$10$NN/RJ/8VLXnI3oJDQV4uU.zGheYWkBdTFVajap41mMCGkj4sQuBwK','Rahis Abdul Razak',0,0);
-- Authorities
INSERT INTO authorities (authority, user_id) VALUES ('ROLE_USER', 1);
INSERT INTO authorities (authority, user_id) VALUES ('ROLE_ADMIN', 1);
INSERT INTO authorities (authority, user_id) VALUES ('ROLE_USER', 2);
INSERT INTO authorities (authority, user_id) VALUES ('ROLE_USER', 3);
INSERT INTO authorities (authority, user_id) VALUES ('ROLE_USER', 4);

