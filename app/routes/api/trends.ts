import type { LoaderFunction } from "@remix-run/server-runtime";
import ky from "ky";
import {
  pipe,
  assoc,
  map,
  flatten,
  range,
  groupWith,
  eqProps,
  sort,
  prop,
  descend,
  take,
  reduce,
} from "ramda";

interface GenreCount {
  genre: string;
  count: number;
}

const count_by_genre_in_year = async (year: string) =>
  ky
    .get(
      "https://over-engineering-backend.fly.dev/statistics/v1/count_by_genre",
      {
        searchParams: { year },
      }
    )
    .json<GenreCount[]>();

//@ts-ignore
const byCount = descend(prop("count"));

const merge = reduce(
  (obj: any, { genre, count, year }) => ({
    ...obj,
    [genre]: count,
    x: year,
  }),
  {}
);

const getProgrammingLanguage = () =>
  Promise.all(
    range(2015, 2022)
      .map(String)
      .map((year) =>
        count_by_genre_in_year(year).then(map(assoc("year", year)))
      )
  )
    .then(flatten)
    .then(groupWith(eqProps("year")))
    //@ts-ignore
    .then(map(pipe(sort(byCount), take(5))))
    //@ts-ignore
    .then(map(merge));

export const loader: LoaderFunction = () => {
  return getProgrammingLanguage();
};
