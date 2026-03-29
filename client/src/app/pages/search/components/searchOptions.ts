import { SearchOption } from '../searchTypes';

export const genreOptions: SearchOption[] = [
  { name: 'Action', showName: 'Action' },
  { name: 'Adventure', showName: 'Adventure' },
  { name: 'Comedy', showName: 'Comedy' },
  { name: 'Drama', showName: 'Drama' },
  { name: 'Ecchi', showName: 'Ecchi' },
  { name: 'Fantasy', showName: 'Fantasy' },
  { name: 'Horror', showName: 'Horror' },
  { name: 'Mahou Shoujo', showName: 'Mahou Shoujo' },
  { name: 'Mecha', showName: 'Mecha' },
  { name: 'Music', showName: 'Music' },
  { name: 'Mystery', showName: 'Mystery' },
  { name: 'Psychological', showName: 'Psychological' },
  { name: 'Romance', showName: 'Romance' },
  { name: 'Sci-Fi', showName: 'Sci-Fi' },
  { name: 'Slice of Life', showName: 'Slice of Life' },
  { name: 'Sports', showName: 'Sports' },
  { name: 'Supernatural', showName: 'Supernatural' },
  { name: 'Thriller', showName: 'Thriller' },
  { name: 'Hentai', showName: 'Hentai' },
];

const generateYearOptions = (): SearchOption[] => {
  const date = new Date();

  const LAST_YEAR = date.getFullYear();
  const FIRST_YEAR = 1940;

  return Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => ({
    name: (LAST_YEAR - i).toString(),
    showName: (LAST_YEAR - i).toString(),
  }));
};

export const yearOptions = generateYearOptions();

export const formatOptions: SearchOption[] = [
  { name: 'TV', showName: 'TV' },
  { name: 'TV_SHORT', showName: 'TV Short' },
  { name: 'MOVIE', showName: 'Movie' },
  { name: 'SPECIAL', showName: 'Special' },
  { name: 'OVA', showName: 'OVA' },
  { name: 'ONA', showName: 'ONA' },
  { name: 'MUSIC', showName: 'Music' },
];

export const statusOptions: SearchOption[] = [
  { name: 'RELEASING', showName: 'Airing' },
  { name: 'NOT_YET_RELEASED', showName: 'Not Yet Aired' },
  { name: 'FINISHED', showName: 'Finished' },
  { name: 'CANCELLED', showName: 'Cancelled' },
];

export const sortOptions: SearchOption[] = [
  { name: 'POPULARITY_DESC', showName: 'Popularity' },
  { name: 'TITLE_ENGLISH', showName: 'Title' },
  { name: 'SCORE_DESC', showName: 'Score' },
  { name: 'TRENDING_DESC', showName: 'Trending' },
  { name: 'ID_DESC', showName: 'Date' },
];

const toList = (string: string, typeList: SearchOption[]) => {
  let list: SearchOption[] = [];

  if (string) {
    string.split(',').map((item) => {
      let object = typeList.find((listItem) => listItem.name === item);
      if (object === undefined) return;
      list.push(object);
    });
  }
  return list;
};

export const getGenres = (string: string) => {
  return toList(string, genreOptions);
};

export const getYear = (string: string) => {
  let optionYear: SearchOption[] = [];
  if (!string) return optionYear;

  let year = string.split(',')[0]; //* if &year=2020,2021 takes firs year (2020)
  optionYear.push({ name: year, showName: year });
  return optionYear;
};

export const getFormats = (string: string) => {
  return toList(string, formatOptions);
};

export const getStatus = (string: string) => {
  let status: SearchOption[] = [];
  if (!string) return status;

  if (string) {
    const statusString = string.split(',')[0];
    let object = statusOptions.find((listItem) => listItem.name === statusString);
    if (object) status.push(object);
  }
  return status;
};
