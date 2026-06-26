CREATE TABLE `User`(
    `user_id` INTEGER NOT NULL PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `username` VARCHAR(255) NOT NULL UNIQUE,
    `created_on` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `avatar` VARCHAR(255) ,
    `banner` VARCHAR(255),
    `refresh_token` VARCHAR(255)
);

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

CREATE TABLE `Anime`(
    `anime_id` BIGINT UNSIGNED NOT NULL,
    `anime_mal_id` BIGINT UNIQUE NOT NULL,
    `anime_title` VARCHAR(255) NOT NULL,
    `anime_cover` VARCHAR(255) NOT NULL,
    `anime_episodes` BIGINT NOT NULL,
    `anime_avg_episode_duration` BIGINT NOT NULL,
    `anime_genres` TEXT NOT NULL DEFAULT '',
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

CREATE TABLE `Shared List`(
`shared_list_id` INTEGER PRIMARY KEY,
`shared_list_name` VARCHAR(255) NOT NULL,
`message` VARCHAR(255) NULL
);

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
    `date` TEXT NOT NULL,                 
    `watchtime` INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY(`user_id`, `date`)

     CONSTRAINT fk_user
        FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE
);

CREATE TABLE `Genre` (
    `user_id` INTEGER NOT NULL,
    `genre` TEXT NOT NULL,                  
    `watched_animes` INTEGER NOT NULL DEFAULT 0, 
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