import Section from "~/components/Section";
import { Line, Legend } from "recharts";
import { chain, equals, keys, pipe, reject, uniq } from "ramda";
import useFetcherLoad from "~/utils/useFetcherLoad";
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
  Legend,
} from "recharts";
import { useState } from "react";

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

const PopularCategories = () => {
  const data = useFetcherLoad("/api/trends");

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

                    {payload.map((data) => (
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

const Trends = () => (
  <>
    <img
      className="fixed bottom-0 right-0 w-[90%] opacity-20"
      src="https://survey.stackoverflow.co/2022/hero.bfb84f73.svg"
      alt="background image"
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
          <h1 className="text-gradient text-3xl font-semibold lg:text-5xl">
            The State of Developer Ecosystem
          </h1>

          <p className="text-lg lg:text-2xl">
            In May 2022 over 70,000 developers told us how they learn and level
            up, which tools they’re using, and what they want.
          </p>
        </div>
      </Section>

      <Section className="h-screen">
        <h2 className="mb-8 text-4xl font-semibold">Popular Categories</h2>
        <PopularCategories />
      </Section>
    </div>
  </>
);

export default Trends;
