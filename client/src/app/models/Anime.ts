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
  coverImage: {
    large: String;
  };
  genres: [];
  status: String;
}
