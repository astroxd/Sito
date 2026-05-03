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

CREATE TABLE `Anime`(
    `anime_id` BIGINT UNSIGNED NOT NULL,
    `anime_mal_id` BIGINT UNIQUE NOT NULL,
    `anime_title` VARCHAR(255) NOT NULL,
    `anime_cover` VARCHAR(255) NOT NULL,
    `anime_episodes` BIGINT NOT NULL,
    `anime_avg_episode_duration` BIGINT NOT NULL,
    PRIMARY KEY(`anime_id`)
);

CREATE TABLE `Watched Episodes`(
    `user_id` BIGINT UNSIGNED NOT NULL,
    `anime_id` BIGINT UNSIGNED NOT NULL,
    `last_episode_watched` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY(`user_id`, `anime_id`)
    CONSTRAINT fk_user
        FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE
    CONSTRAINT fk_anime
        FOREIGN KEY (`anime_id`) REFERENCES `Anime`(`anime_id`) ON DELETE CASCADE
);

SELECT * FROM 'Private Anime' p
    INNER JOIN Anime ON Anime.anime_id = p.anime_id
    INNER JOIN 'Watched Episodes' w ON w.anime_id = p.anime_id 
    WHERE p.user_id = 1 AND p.status = ?
