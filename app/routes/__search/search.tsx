import { useEffect, useState } from "react";
import { json, LoaderFunction } from "@remix-run/server-runtime";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { promiseHash, redirectBack } from "remix-utils";
import clsx from "clsx";
import Icon from "~/components/Icon";
import type { CommonProps } from "~/types";
import db from "~/db.server";
import { evolve, join, map, pipe, prop, slice, split, trim } from "ramda";
import parse from "node-html-parser";
import * as datefns from "date-fns";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import InfiniteLoader from "react-window-infinite-loader";

interface SearchResult {
  series: {
    name: string;
    href: string;
  };
  tags: string[];
  users: {
    name: string;
    href: string;
  };
  href: string;
  title: string;
  publish_at: string;
  content: string;
}

type SearchProps = {
  query: string;
  skip: number;
  take: number;
};
const search = async ({ query, skip, take }: SearchProps) => {
  const { data, error } = await db
    .from("articles")
    .select(
      `
        href,
        title,
        publish_at,
        content,
        tags,
        users ( name, href ),
        series ( name, href )
    `
    )
    .textSearch("title", query)
    .range(skip, skip + take);

  if (error) throw error;
  return data;
};

const count = async ({ query }: Pick<SearchProps, "query">) => {
  const { error, count } = await db
    .from("articles")
    .select("href", { count: "exact", head: true })
    .textSearch("title", query);

  if (error) throw error;
  return count;
};

const COUNT_PER_PAGE = 20;

export const loader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url);

  const query = url.searchParams.get("q");
  if (!query) return redirectBack(request, { fallback: "/" });

  const _skip = url.searchParams.get("skip");
  const skip = _skip ? Number(_skip) : 0;

  const _take = url.searchParams.get("take");
  const take = _take ? Number(_take) : COUNT_PER_PAGE;

  return (
    promiseHash({
      query: Promise.resolve(query),
      results: search({ query, skip, take }).then(
        map(
          evolve({
            title: trim,
            tags: JSON.parse,
            publish_at: (source: string) => {
              const date = datefns.parse(
                source,
                "yyyy-MM-dd HH:mm:ss",
                new Date()
              );
              return datefns.format(date, "dd MMM yyyy");
            },
            content: pipe(
              parse,
              prop("textContent"),
              trim,
              //@ts-ignore
              split("\n"),
              slice(0, 30),
              join("\n")
              //
            ),
            users: evolve({
              name: trim,
            }),
          })
        )
      ),
      count: count({ query }),
    })
      //
      .then(json)
  );
};

type Props = CommonProps &
  SearchResult & {
    maxShowHashTags?: number;
  };
export const Result = (props: Props) => {
  const maxShowHashTags = props.maxShowHashTags || 3;
  const tooMuchHashTags = props.tags.length - maxShowHashTags;
  const hashtags = props.tags.slice(0, maxShowHashTags);
  return (
    <div
      className={clsx("relative w-full", props.className)}
      style={props.style}
    >
      <div className="relative space-y-2 text-sm md:text-base">
        <div className="flex items-center gap-2">
          {/* Series */}
          <a
            href={props.series.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate"
          >
            {props.series.name}
          </a>

          {/* Author */}
          {props.users && (
            <>
              <span> — </span>
              <a
                href={props.series.href}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-max"
              >
                {props.users.name}
              </a>
            </>
          )}
        </div>

        {/* Title */}
        <h2
          className={clsx("pb-1 font-bold", "text-xl md:text-2xl", "truncate")}
        >
          <a href={props.href} target="_blank" rel="noopener noreferrer">
            {props.title}
          </a>
        </h2>

        {/* Snippet */}
        <p className="text-primary-2 line-clamp-3">
          <time>{props.publish_at} — </time>
          {props.content}
        </p>

        <footer className="flex flex-col gap-2 pt-2">
          {/* Read Time */}
          <div className="flex items-center gap-1">
            <Icon.Book className="w-4" />

            <time>15 mins read</time>
          </div>

          {/* Hash Tags */}
          <ul className="flex flex-wrap gap-2">
            {hashtags.map((hashtag) => (
              <li key={hashtag} className="mt-2">
                <span className="solid-sm rounded border">{hashtag}</span>
              </li>
            ))}

            {tooMuchHashTags > 0 && (
              <li className="mt-2">
                <span className="solid-sm rounded border">
                  {" "}
                  + {tooMuchHashTags}
                </span>
              </li>
            )}
          </ul>
        </footer>
      </div>
    </div>
  );
};

interface Data {
  query: string;
  results: SearchResult[];
  count: number;
}
const Page = () => {
  const data = useLoaderData<Data>();
  const [items, setItems] = useState(data.results);

  useEffect(() => {
    setItems(data.results);
  }, [data, setItems]);

  const fetcher = useFetcher();
  useEffect(() => {
    if (!fetcher.data) return;

    setItems((prevItems) => [...prevItems, ...fetcher.data.results]);
  }, [fetcher.data]);

  const margin = 20;

  function loadNextPage() {
    const params = new URLSearchParams();
    params.set("skip", String(items.length));
    params.set("take", String(COUNT_PER_PAGE));
    params.set("q", String(data.query));
    fetcher.load(`/search?${params.toString()}`);
  }

  const hasNextPage = items.length < data.count;

  const isNextPageLoading = fetcher.state === "loading";

  // If there are more items to be loaded then add an extra row to hold a loading indicator.
  const itemCount = hasNextPage ? items.length + 1 : items.length;

  // Only load 1 page of items at a time.
  // Pass an empty callback to InfiniteLoader in case it asks us to load more than once.
  const loadMoreItems = isNextPageLoading ? () => {} : loadNextPage;

  // Every row is loaded except for our loading indicator row.
  const isItemLoaded = (index: number) => !hasNextPage || index < items.length;

  return (
    <div className="flex flex-1 flex-col">
      {/* Number of results found */}
      <p className="my-4 px-4 lg:ml-44 lg:px-0">About {data.count} results</p>

      {/* List of Search Results */}
      <div className="flex-1">
        <AutoSizer>
          {(size) => (
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={itemCount}
              loadMoreItems={loadMoreItems}
            >
              {({ onItemsRendered, ref }) => (
                <List
                  {...size}
                  itemCount={itemCount}
                  itemSize={236 + 2 * margin}
                  onItemsRendered={onItemsRendered}
                  ref={ref}
                >
                  {({ index, style }) =>
                    !isItemLoaded(index) ? (
                      <div
                        className={clsx(
                          "px-4 lg:ml-44 lg:max-w-screen-md lg:px-0",
                          "flex items-center justify-center"
                        )}
                        style={{
                          ...style,
                          marginTop: margin,
                          marginBottom: margin,
                        }}
                      >
                        <div className="w-32">
                          <Icon.Loading />
                        </div>
                      </div>
                    ) : (
                      <Result
                        className="px-4 lg:ml-44 lg:max-w-screen-md lg:px-0"
                        style={{
                          ...style,
                          marginTop: margin,
                          marginBottom: margin,
                        }}
                        {...items[index]}
                      />
                    )
                  }
                </List>
              )}
            </InfiniteLoader>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};

export default Page;
