-- Users
INSERT INTO users (username, email, password,displayname) VALUES ('alice', 'alice@example.com', '$2a$10$NN/RJ/8VLXnI3oJDQV4uU.zGheYWkBdTFVajap41mMCGkj4sQuBwK','Alice');
INSERT INTO users (username, email, password,displayname) VALUES ('bob', 'bob@example.com', '$2a$10$NN/RJ/8VLXnI3oJDQV4uU.zGheYWkBdTFVajap41mMCGkj4sQuBwK','Bob');
INSERT INTO users (username, email, password,displayname) VALUES ('charlie', 'charlie@example.com', '$2a$10$NN/RJ/8VLXnI3oJDQV4uU.zGheYWkBdTFVajap41mMCGkj4sQuBwK','Charlie');
INSERT INTO users (username, email, password,displayname) VALUES ('rahisarm', 'rahis@example.com','$2a$10$NN/RJ/8VLXnI3oJDQV4uU.zGheYWkBdTFVajap41mMCGkj4sQuBwK','Rahis Abdul Razak');
-- Authorities
INSERT INTO authorities (authority, user_id) VALUES ('ROLE_USER', 1);
INSERT INTO authorities (authority, user_id) VALUES ('ROLE_ADMIN', 1);
INSERT INTO authorities (authority, user_id) VALUES ('ROLE_USER', 2);
INSERT INTO authorities (authority, user_id) VALUES ('ROLE_USER', 3);
INSERT INTO authorities (authority, user_id) VALUES ('ROLE_USER', 4);
