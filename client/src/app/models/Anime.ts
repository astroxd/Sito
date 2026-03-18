export interface Anime {
  id: Number;
  title: {
    english?: String;
    romaji?: String;
  };
  episodes?: Number;
  nextAiringEpisode?: {
    episode?: Number;
  };
  popularity: Number;
  coverImage?: {
    large?: String;
    extraLarge?: String;
  };
  bannerImage?: String;
  genres: [];
  status: String;
}
