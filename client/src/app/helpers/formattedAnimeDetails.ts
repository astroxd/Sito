import { Anime } from '../models/Anime';
import { AnimeCharacter } from '../models/AnimeDetails';

export function getDateAired(startDate: any, endDate: any) {
  const options: any = {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  };

  let formattedStartDate = '?';
  let formattedEndDate = '?';

  const { year: sYear, month: sMonth, day: sDay } = startDate;
  const { year: eYear, month: eMonth, day: eDay } = endDate;

  if (sYear !== null) {
    const startDateObj = new Date(sYear, sMonth - 1, sDay);

    formattedStartDate = startDateObj.toLocaleDateString('en-US', options);
  }
  if (eYear !== null) {
    const endDateObj = new Date(eYear, eMonth - 1, eDay);

    formattedEndDate = endDateObj.toLocaleDateString('en-US', options);
  }

  return `${formattedStartDate} to ${formattedEndDate}`;
}

export function getStatus(status: string) {
  switch (status) {
    case 'RELEASING':
      return 'Airing';
    case 'NOT_YET_RELEASED':
      return 'Not Yet Aired';
    case 'FINISHED':
      return 'Finished';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return 'Paused';
  }
}

export function getCharacterName(name: AnimeCharacter['name']) {
  const { first, middle, last } = name;
  let fullName = first ?? '';

  if (middle !== null) {
    fullName = fullName.concat(` ${middle}`);
  }
  if (last !== null) {
    fullName = fullName.concat(` ${last}`);
  }
  return fullName;
}

export function getAiringEpisode(secondsSinceEpoch: any) {
  let date = '?';
  if (secondsSinceEpoch) {
    date = new Date(secondsSinceEpoch * 1000).toLocaleString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
      hour12: true,
    });
  }

  return date;
}

export function getEpisodes(
  status: string,
  nextAiringEpisode: Anime['nextAiringEpisode'],
  episodes: number | undefined,
) {
  switch (status) {
    case 'RELEASING':
      return `${nextAiringEpisode ? nextAiringEpisode.episode - 1 : '?'} / ${
        episodes ?? '?'
      }`;
    default:
      //* FINISHED || CANCELLED || NOT_YET_RELEASED || HIATUS(paused)
      return `${episodes ?? '?'} / ${episodes ?? '?'}`;
  }
}
