import Anime from "#models/details.model.js";
import {
  AnimeCharacter,
  AnimeCharacterRes,
  AnimeCharacterResponse,
  AnimeDetails,
  AnimeDetailsResponse,
  AnimeEpisodeResponse,
  AnimeRecommendation,
  AnimeRecommendationResponse,
  BaseGraphQLResponse,
  GraphQLQuery,
} from "#types";
import { fetchWithRetry, logger } from "@anime-hub/common";
import { Request, Response } from "express";

const GRAPHQL_URL = process.env.GRAPHQL_URL || "https://graphql.anilist.co";

export const getAnimeDetails = async (req: Request, res: Response) => {
  const { id } = req.params;

  const query: GraphQLQuery = {
    query: `
        query($id: Int){
            Media(id: $id){
                id
                idMal
                title{
                    english
                    romaji
                    native
                }
                description(asHtml: false)
                format
                studios{
                    nodes{
                        name
                    }
                }
                startDate{
                    year
                    month
                    day
                }
                endDate{
                    year
                    month
                    day
                }
                status
                genres
                averageScore
                popularity
                duration
                coverImage{
                  extraLarge
                  large
                }
                favourites
                episodes
                nextAiringEpisode{
                  episode
                  airingAt
                }
                tags{
                  id
                  name
                }
            }
        }

    `,
    variables: { id },
  };

  const response = await fetchData<AnimeDetailsResponse>(query);

  const details = response.data.Media;

  logger.trace(details);

  if (details) {
    try {
      await Anime.upsert(Anime.sanitize(details));
      logger.info("Anime synced successfully");
    } catch (error) {
      logger.error(error);
    }
  }

  return res.status(200).json(details);
};

export const getAnimeRecommendations = async (req: Request, res: Response) => {
  const { id } = req.params;

  const query: GraphQLQuery = {
    query: `
        query($id: Int){
            Media(id: $id){
                recommendations(sort: RATING_DESC, perPage: 5) {
                    edges {
                          node {
                            mediaRecommendation {
                                id
                                title {
                                    english
                                    romaji
                                }
                                coverImage {
                                    large
                                    extraLarge
                                }
                                bannerImage
                                episodes
                                popularity
                                nextAiringEpisode{
                                    episode
                                }
                                status
                                genres
                            }
                          }
                    }
                }
            }
        }
    `,
    variables: { id },
  };

  const response = await fetchData<AnimeRecommendationResponse>(query);

  const recommendations = response.data.Media?.recommendations.edges || [];

  const parsedRecommendations = recommendations.map(
    (rec) => rec.node.mediaRecommendation,
  );

  logger.trace(parsedRecommendations);

  return res.status(200).json(parsedRecommendations);
};

export const getAnimeCharacters = async (req: Request, res: Response) => {
  const { id, page } = req.params;

  const query: GraphQLQuery = {
    query: `
        query($id: Int, $pageNumber: Int){
				Media(id: $id){
					characters(sort: [RELEVANCE, FAVOURITES_DESC], page: $pageNumber) {
						pageInfo {
							hasNextPage
						}
						edges{
							node {
							  name {
								first
								middle
								last
							  }
							  image{
								large
							  }
							}
							role
							voiceActors(language:JAPANESE) {
							  name {
								full
							  }
							  image{
								large
							  }
							  languageV2
							}

						}
					}
				}
			}

    `,
    variables: { id, pageNumber: page },
  };

  const graphqlResponse = await fetchData<AnimeCharacterResponse>(query);

  const characters = graphqlResponse.data.Media.characters;

  const parsedCharacters = characters.edges.map(
    ({ node: { image, name }, role, voiceActors }) => {
      const character: AnimeCharacter = {
        image,
        name,
        role,
        voiceActors,
      };
      return character;
    },
  );

  const response: AnimeCharacterRes = {
    characters: parsedCharacters,
    pageInfo: characters.pageInfo,
  };

  return res.status(200).json(response);
};

export const getAnimeEpisodes = async (req: Request, res: Response) => {
  const { MALanimeId, page } = req.params;
  const query = `https://api.jikan.moe/v4/anime/${MALanimeId}/videos/episodes?page=${page}`;

  try {
    // const response = await fetchWithRetry(
    //   query,
    //   {},
    //   {
    //     retries: 0,
    //     initialDelayMs: 1200,
    //     backoffFactor: 2,
    //   },
    // );

    const response = await fetch(query);

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(504).json({
        message: "Jikan API error after retries",
        details: errorData,
        data: [],
      });
    }

    const parsedResponse = await response.json();
    return res.status(200).json(parsedResponse);
  } catch (error) {
    // logger.error(error, "Errore irreversibile nella chiamata a Jikan");
    return res.status(504).json({
      message:
        "Service Unavailable: Failed to connect to external anime provider",
      data: [],
    });
  }
};

const fetchData = async <T extends BaseGraphQLResponse>(
  query: GraphQLQuery,
) => {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(query),
  });

  const parsedResponse = (await response.json()) as T;

  if (!response.ok || parsedResponse.errors) {
    logger.error(
      `GraphQL error: ${response.statusText || parsedResponse.errors}`,
    );
  }

  return parsedResponse;
};
