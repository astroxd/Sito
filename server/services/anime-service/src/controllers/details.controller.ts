import { Request, Response } from "express";
import { AnimeDetails } from "../models/details.model";

const GRAPHQL_URL = "https://graphql.anilist.co";

export const getAnimeDetails = async (req: Request, res: Response) => {
  const { id } = req.params;

  const query = {
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
            }
        }

    `,
    variables: { id },
  };

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(query),
  });

  const parsedResponse = (await response.json()) as
    | {
        data: {
          Media: AnimeDetails;
        };
        errors?: undefined;
      }
    | {
        data: {
          Media: null;
        };
        errors: {
          message: string;
          status: number;
          locations: { line: number; column: number }[];
        }[];
      };
  if (!response.ok || parsedResponse.errors) {
    console.log("GraphQL error:", response.statusText || parsedResponse.errors);
  }

  const details = parsedResponse.data.Media;
  console.log(details);

  return res.status(200).json(details);
};
