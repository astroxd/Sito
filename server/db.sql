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
INSERT INTO User VALUES(2,"b@b.com",'123', 'bro', datetime('now'), '', '');

SELECT * FROM User;

CREATE TABLE `Anime`(
    `anime_id` BIGINT UNSIGNED NOT NULL,
    `anime_mal_id` BIGINT UNIQUE NOT NULL,
    `anime_title` VARCHAR(255) NOT NULL,
    `anime_cover` VARCHAR(255) NOT NULL,
    `anime_episodes` BIGINT NOT NULL,
    `anime_avg_episode_duration` BIGINT NOT NULL,
    `anime_genres` TEXT NOT NULL DEFAULT ''
    PRIMARY KEY(`anime_id`)
);




CREATE TABLE `Watched Episodes`(
    `user_id` INTEGER NOT NULL,
    `anime_id` INTEGER NOT NULL,
    `last_episode_watched` INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY(`user_id`, `anime_id`)
    CONSTRAINT fk_user
        FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE
    CONSTRAINT fk_anime
        FOREIGN KEY (`anime_id`) REFERENCES `Anime`(`anime_id`) ON DELETE CASCADE
);

SELECT * FROM 'Private Anime' p
    INNER JOIN Anime ON Anime.anime_id = p.anime_id
    INNER JOIN 'Watched Episodes' w ON w.anime_id = p.anime_id 
    WHERE p.user_id = 1 AND p.status = ?;

CREATE TABLE `Shared List`(
`shared_list_id` BIGINT PRIMARY KEY,
`shared_list_name` VARCHAR(255) NOT NULL,
`message` VARCHAR(255) NULL
);

CREATE TABLE `Shared List User`(
    `shared_list_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `role` SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY(`shared_list_id`, `user_id`)

    CONSTRAINT fk_user
        FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE
    CONSTRAINT fk_shared_list
        FOREIGN KEY (`shared_list_id`) REFERENCES `Shared List`(`shared_list_id`) ON DELETE CASCADE
);

CREATE TABLE `Shared List Anime`(
    `shared_list_id` BIGINT UNSIGNED NOT NULL,
    `anime_id` BIGINT UNSIGNED NOT NULL,
    `added_on` TIMESTAMP NOT NULL,
    `last_activity_at` TIMESTAMP NOT NULL,
    PRIMARY KEY(`shared_list_id`, `anime_id`)

    CONSTRAINT fk_shared_list
        FOREIGN KEY (`shared_list_id`) REFERENCES `Shared List`(`shared_list_id`) ON DELETE CASCADE

    CONSTRAINT fk_anime
        FOREIGN KEY (`anime_id`) REFERENCES `Anime`(`anime_id`) ON DELETE CASCADE
    
);

CREATE TABLE `Shared List Progress`(
    `shared_list_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `anime_id` BIGINT UNSIGNED NOT NULL,
    `current_episode` BIGINT UNSIGNED NOT NULL,
    `updated_at` TIMESTAMP NOT NULL,
    PRIMARY KEY(
        `shared_list_id`,
        `user_id`,
        `anime_id`
    )
    CONSTRAINT fk_shared_list
        FOREIGN KEY (`shared_list_id`) REFERENCES `Shared List`(`shared_list_id`) ON DELETE CASCADE
 
    CONSTRAINT fk_user
        FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE
    
    CONSTRAINT fk_anime
        FOREIGN KEY (`anime_id`) REFERENCES `Anime`(`anime_id`) ON DELETE CASCADE
);

INSERT INTO `Shared List` VALUES (1, "Test Condivisa", "message");
INSERT INTO `Shared List` VALUES (2, "Test 2", '');
INSERT INTO `Shared List User` VALUES (1, 1, 0);
INSERT INTO `Shared List User` VALUES (2, 1, 0);
INSERT INTO `Shared List User` VALUES (1, 2, 0);


INSERT INTO `Shared List Anime` VALUES(1, 21, datetime('now'), datetime('now'));
INSERT INTO `Shared List Anime` VALUES(1, 20, datetime('now'), datetime('now'));
INSERT INTO `Shared List Progress` VALUES(1, 1, 21, 40, datetime('now'));

INSERT INTO `Shared List Progress` VALUES(1, 2, 21, 400, datetime('now'));
INSERT INTO `Shared List Progress` VALUES(1, 1, 20, 300, datetime('now'));
INSERT INTO `Shared List Progress` VALUES(2, 1, 20, 300, datetime('now'));
DELETE FROM `Shared List Progress` WHERE user_id = 1 AND shared_list_id = 2;
ALTER TABLE 'User' ADD COLUMN "refresh_token" VARCHAR(255);



-- 1. Rinomina la tabella attuale per non perderla
ALTER TABLE 'Shared List' RENAME TO Shared_list_old;

-- 2. Crea la nuova tabella con la struttura corretta
CREATE TABLE `Shared List`(
`shared_list_id` INTEGER PRIMARY KEY,
`shared_list_name` VARCHAR(255) NOT NULL,
`message` VARCHAR(255) NULL
);

-- 3. Copia i dati dalla vecchia alla nuova
INSERT INTO 'Shared List' ('shared_list_id', 'shared_list_name', 'message')
SELECT 'shared_list_id', 'shared_list_name', 'message' FROM Shared_list_old;


INSERT INTO `Shared List` VALUES (1, "Test Condivisa", "message");
INSERT INTO `Shared List` VALUES (2, "Test 2", '');
-- 4. Elimina la vecchia tabella
DROP TABLE Shared_list_old;


-- 1. Rinomina la tabella attuale per non perderla
ALTER TABLE 'Shared List Progress' RENAME TO Shared_list_old;

CREATE TABLE `Shared List Progress`(
    `shared_list_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `anime_id` INTEGER NOT NULL,
    `current_episode` INTEGER DEFAULT 0,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(
        `shared_list_id`,
        `user_id`,
        `anime_id`
    ),
   
    CONSTRAINT fk_user
        FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE,
    
    CONSTRAINT fk_anime
        FOREIGN KEY (`anime_id`) REFERENCES `Anime`(`anime_id`) ON DELETE CASCADE,
    
    CONSTRAINT fk_shared_list_anime_composite
        FOREIGN KEY (`shared_list_id`, `anime_id`) 
        REFERENCES `Shared List Anime`(`shared_list_id`, `anime_id`) ON DELETE CASCADE
);

-- 3. Copia i dati dalla vecchia alla nuova
INSERT OR REPLACE INTO `Shared List Progress` (`shared_list_id`, `user_id`, `anime_id`, `current_episode`, `updated_at`)
SELECT `shared_list_id`, `user_id`, `anime_id`, `current_episode`, `updated_at` 
FROM Shared_list_old;




ALTER TABLE 'Private Anime' RENAME TO Shared_list_old;

CREATE TABLE `Private Anime`(
    `user_id` INTEGER NOT NULL,
    `anime_id` INTEGER NOT NULL,
    `status` TEXT NOT NULL DEFAULT 'WATCHING',
    `added_on` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(`user_id`, `anime_id`)

    CONSTRAINT fk_user
        FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE,
    
    CONSTRAINT fk_anime
        FOREIGN KEY (`anime_id`) REFERENCES `Anime`(`anime_id`) ON DELETE CASCADE,

    CONSTRAINT check_status CHECK (`status` IN ('WATCHING', 'COMPLETED', 'DROPPED'))

);
INSERT INTO `Private Anime` (`user_id`, `anime_id`, `status`, `added_on`)
SELECT 
    `user_id`,
    `anime_id`, 
    CASE MAX(`status`) -- In caso di vecchio duplicato, prende il numero più alto (es. 1 = COMPLETED vince su 0 = WATCHING)
        WHEN 0 THEN 'WATCHING'
        WHEN 1 THEN 'COMPLETED'
        ELSE 'WATCHING'
    END,
    MAX(`added_on`)
FROM `Shared_list_old`
GROUP BY `user_id`, `anime_id`; -- Raggruppa assicurando l'unicità richiesta dalla nuova PK






DROP TABLE Shared_list_old;

-- 1. Rinomina la tabella attuale per non perderla
ALTER TABLE 'Shared List Anime' RENAME TO Shared_list_old;

CREATE TABLE `Shared List Anime`(
    `shared_list_id` INTEGER NOT NULL,
    `anime_id` INTEGER NOT NULL,
    `added_on` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_activity_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(`shared_list_id`, `anime_id`)

    CONSTRAINT fk_shared_list
        FOREIGN KEY (`shared_list_id`) REFERENCES `Shared List`(`shared_list_id`) ON DELETE CASCADE

    CONSTRAINT fk_anime
        FOREIGN KEY (`anime_id`) REFERENCES `Anime`(`anime_id`) ON DELETE CASCADE
    
);

-- 3. Copia i dati dalla vecchia alla nuova
INSERT OR REPLACE INTO `Shared List Anime` (`shared_list_id`, `anime_id`, `added_on`, `last_activity_at`)
SELECT `shared_list_id`, `anime_id`, `added_on`, `last_activity_at`
FROM Shared_list_old;




DROP TABLE Shared_list_old;

-- 1. Rinomina la tabella attuale per non perderla
ALTER TABLE 'Shared List User' RENAME TO Shared_list_old;


CREATE TABLE `Shared List User`(
    `shared_list_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `role` TEXT NOT NULL DEFAULT 'MEMBER',
    `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(`shared_list_id`, `user_id`)

    CONSTRAINT fk_user
        FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE
    CONSTRAINT fk_shared_list
        FOREIGN KEY (`shared_list_id`) REFERENCES `Shared List`(`shared_list_id`) ON DELETE CASCADE

    CONSTRAINT check_role CHECK (`role` IN ('OWNER', 'EDITOR', 'MEMBER'))

);

-- 3. Copia i dati dalla vecchia alla nuova
INSERT OR REPLACE INTO `Shared List User` (`shared_list_id`, `user_id`)
SELECT `shared_list_id`, `user_id`
FROM Shared_list_old;


CREATE TABLE `Friendship` (
    `user_id_1` INTEGER NOT NULL,
    `user_id_2` INTEGER NOT NULL,
    `status` TEXT NOT NULL DEFAULT 'PENDING',
    `sender_user_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id_1`, `user_id_2`),
    
    CONSTRAINT fk_user_1
        FOREIGN KEY (`user_id_1`) REFERENCES `User`(`user_id`) ON DELETE CASCADE,
    CONSTRAINT fk_user_2
        FOREIGN KEY (`user_id_2`) REFERENCES `User`(`user_id`) ON DELETE CASCADE,
    CONSTRAINT fk_sender_user
        FOREIGN KEY (`sender_user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE,
    
    CONSTRAINT check_status CHECK (`status` IN ('PENDING', 'ACCEPTED'))
);


CREATE TABLE `SharedListInvitation` (
    `shared_list_id` INTEGER NOT NULL,
    `sender_user_id` INTEGER NOT NULL,
    `invited_user_id` INTEGER NOT NULL,
    `status` TEXT NOT NULL DEFAULT 'PENDING',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`shared_list_id`, `invited_user_id`),
    
    CONSTRAINT fk_invitation_list
        FOREIGN KEY (`shared_list_id`) REFERENCES `Shared List`(`shared_list_id`) ON DELETE CASCADE,
    CONSTRAINT fk_invitation_sender
        FOREIGN KEY (`sender_user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE,
    CONSTRAINT fk_invitation_invited
        FOREIGN KEY (`invited_user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE,
        
    CONSTRAINT check_status CHECK (`status` IN ('PENDING', 'ACCEPTED'))
);

CREATE TABLE `Statistics` (
    `user_id` INTEGER NOT NULL PRIMARY KEY,
    `total_time` INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT fk_user
        FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE
);

CREATE TABLE `Daily WatchTime` (
    `user_id` INTEGER NOT NULL,
    `date` TEXT NOT NULL,                  -- Formato standard YYYY-MM-DD (es: 2026-06-25)
    `watchtime` INTEGER NOT NULL DEFAULT 0,-- Minuti guardati in questa specifica data
    PRIMARY KEY(`user_id`, `date`)

     CONSTRAINT fk_user
        FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE
);

CREATE TABLE `Genre` (
    `user_id` INTEGER NOT NULL,
    `genre` TEXT NOT NULL,                  -- Nome del genere (es: 'Shonen', 'Action')
    `watched_animes` INTEGER NOT NULL DEFAULT 0, -- Quanti anime di questo genere ha completato/iniziato
    PRIMARY KEY(`user_id`, `genre`)

    CONSTRAINT fk_user
        FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE
    
    CONSTRAINT check_genre CHECK (
        `genre` IN (
            'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 
            'Fantasy', 'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 
            'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 
            'Slice of Life', 'Sports', 'Supernatural', 'Thriller', 'Hentai'
        )
    )
);



CREATE TABLE `User Badge` (
    `user_id` INTEGER NOT NULL,
    `badge_id` INTEGER NOT NULL,
    `rank` TEXT NOT NULL,
    `unlocked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,            -- Data di sblocco in formato ISO string o Timestamp
    PRIMARY KEY(`user_id`, `badge_id`, `rank`),

    CONSTRAINT fk_user
        FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE,

    CONSTRAINT check_rank CHECK (`rank` IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'SECRET'))
);

