import Section from "~/components/Section";
import { Line, Legend } from "recharts";
import {
  chain,
  equals,
  keys,
  map,
  pipe,
  range,
  reduce,
  reject,
  uniq,
} from "ramda";
import { useState } from "react";
import circular from "~/utils/circular";
import clsx from "clsx";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import api from "~/utils/api";
import { json, LoaderFunction } from "@remix-run/server-runtime";
import { useLoaderData } from "@remix-run/react";
import { promiseHash } from "remix-utils";

const colors = circular([
  "#00429d",
  "#4771b2",
  "#73a2c6",
  "#a5d5d8",
  "#ffffe0",
  "#ffbcaf",
  "#f4777f",
  "#cf3759",
  "#93003a",
]);

type StatisticsProps = {
  year: number;
  top_n: number;
};
const countByGenre = async (searchParams: StatisticsProps) =>
  api
    .get("statistics/v1/count_by_genre", {
      searchParams,
    })
    .json<{ genre: string; count: number }[]>()
    .then(map(({ genre, count }) => ({ key: genre, value: count })));

const countByProgramming = async (searchParams: StatisticsProps) =>
  api
    .get("statistics/v1/prog_lang_count", {
      searchParams,
    })
    .json<{ prog_lang: string; count: number }[]>()
    .then(map(({ prog_lang, count }) => ({ key: prog_lang, value: count })));

type Fn = (props: StatisticsProps) => Promise<{ key: string; value: number }[]>;
const between = (fn: Fn) => (from: number, to: number) =>
  Promise.all(
    range(from, to).map((year) =>
      fn({ year, top_n: 5 })
        .then(reduce((map, { key, value }) => ({ ...map, [key]: value }), {}))
        .then((task) => ({ x: String(year), ...task }))
    )
  );

export const loader: LoaderFunction = () =>
  promiseHash({
    genre: between(countByGenre)(2015, 2022),
    programming: between(countByProgramming)(2015, 2022),
  }).then(json);

type PopularCategoriesProps = {
  data: { name: string }[];
};
const PopularCategories = ({ data }: PopularCategoriesProps) => {
  const keyFn = pipe(
    chain(
      pipe(
        keys,
        reject(equals("x"))
        //
      )
    ),
    uniq
  );

  const [hover, setHover] = useState<string>();

  return (
    <div className="relative">
      <div className="card-layer absolute inset-0 bg-slate-500/20 backdrop-blur-lg" />

      <div className="z-10 h-[80vh] w-full p-4 lg:hidden">
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis axisLine={false} tickLine={false} dataKey="x" />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={({ y, fill, payload }) => (
                <text x={5} y={y} fill={fill}>
                  {payload.value}
                </text>
              )}
              width={1}
            />
            <CartesianGrid opacity={0.1} />

            <Legend align="left" />

            {data &&
              keyFn(data).map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors(index)}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="z-10 hidden h-[80vh] w-full p-8 lg:block">
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis axisLine={false} tickLine={false} dataKey="x" />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={({ y, fill, payload }) => (
                <text x={5} y={y} fill={fill}>
                  {payload.value}
                </text>
              )}
              width={1}
            />
            <CartesianGrid opacity={0.1} />
            <Tooltip
              content={({ active, payload, label }) =>
                active &&
                payload &&
                payload.length && (
                  <div
                    className={clsx("rounded bg-blue-500/90 p-4", "grid gap-1")}
                  >
                    <strong>{label}</strong>

                    <hr className="mb-2 border-current" />

                    {payload
                      .sort((a, b) => Number(b.value) - Number(a.value))
                      .map((data) => (
                        <p key={data.name}>{`${data.name} : ${data.value}`}</p>
                      ))}
                  </div>
                )
              }
            />

            <Legend
              onMouseEnter={(entry) => setHover(entry.dataKey)}
              onMouseLeave={() => setHover(undefined)}
            />

            {data &&
              keyFn(data).map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors(index)}
                  strokeWidth={hover === key ? 2 : 1}
                  strokeOpacity={!hover ? 1 : hover === key ? 1 : 0.4}
                  activeDot={{ r: 8 }}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const Trends = () => {
  const { genre, programming } = useLoaderData<typeof loader>();

  return (
    <>
      <img
        className="fixed bottom-0 right-0 w-[90%] opacity-20"
        src="https://survey.stackoverflow.co/2022/hero.bfb84f73.svg"
        alt="background"
        role="presentation"
      />

      <div className="mx-auto max-w-screen-md lg:max-w-screen-lg">
        <Section className="grid h-screen content-center gap-4">
          <div
            className={clsx(
              "py-8 px-4 lg:p-16",
              "grid gap-4 rounded-lg",
              "bg-slate-700/80",
              "shadow-lg shadow-black"
              //
            )}
          >
            <h1 className="text-gradient py-2 text-3xl font-semibold lg:text-5xl">
              The State of Developer Ecosystem
            </h1>

            <p className="text-lg lg:text-2xl">
              Over 70,000 developers told us how they learn and level up, which
              tools they’re using, and what they want.
            </p>
          </div>
        </Section>

        <Section className="h-screen">
          <h2 className="mb-8 text-4xl font-semibold">Popular Categories</h2>
          <PopularCategories data={genre} />
        </Section>

        <Section className="h-screen">
          <h2 className="mb-8 text-4xl font-semibold">Popular Programming</h2>
          <PopularCategories data={programming} />
        </Section>
      </div>
    </>
  );
};

export default Trends;
