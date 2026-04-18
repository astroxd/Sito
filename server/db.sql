CREATE TABLE `User`(
    `user_id` BIGINT NOT NULL PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `username` VARCHAR(255) NOT NULL UNIQUE,
    `created_on` TIMESTAMP NOT NULL,
    `avatar` VARCHAR(255) NOT NULL,
    `banner` VARCHAR(255) NOT NULL
);


CREATE TABLE `Private Anime`(
    `user_id` BIGINT UNSIGNED NOT NULL,
    `status` TINYINT UNSIGNED NOT NULL,
    `anime_id` BIGINT UNSIGNED NOT NULL,
    `added_on` TIMESTAMP NOT NULL,
    PRIMARY KEY(`user_id`, `status`, `anime_id`)
);

INSERT INTO User VALUES(1,"a@a.com",'123', 'a_str0', datetime('now'), '', '');

SELECT * FROM User;