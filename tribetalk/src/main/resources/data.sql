INSERT INTO users (username, password, enabled) VALUES
                                                    ('user1', 'password1', true),
                                                    ('admin', 'adminPass', true);

INSERT INTO authorities (username, authority)
VALUES
    ('user1', 'ROLE_USER'),
    ('admin', 'ROLE_ADMIN'),
    ('admin', 'ROLE_USER');
