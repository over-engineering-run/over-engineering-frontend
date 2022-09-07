import { useEffect, useState } from "react";
import { json } from "@remix-run/server-runtime";
import type { LoaderFunction } from "@remix-run/server-runtime";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { redirectBack } from "remix-utils";
import clsx from "clsx";
import Icon from "~/components/Icon";
import type { CommonProps } from "~/types";
import { applySpec, multiply, path, pipe } from "ramda";
import * as datefns from "date-fns";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import InfiniteLoader from "react-window-infinite-loader";
import { noop } from "@reach/utils";
import { assert } from "@sindresorhus/is";
import api from "~/utils/api";

interface SearchResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  lastmod: number;
  about_this_result: {
    author: {
      name: string;
      link: string;
    };
    series: {
      name: string;
      link: string;
    };
    hashtags: string[];
    keywords: string[];
    reading_time: number;
  };
}

type SearchProps = {
  q: string;
  page: number;
  limit: number;
};
const search = (searchParams: SearchProps) =>
  api.get("docs/v1/search", { searchParams }).json();

const COUNT_PER_PAGE = 20;

export const loader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url);

  const q = url.searchParams.get("q");
  if (!q) return redirectBack(request, { fallback: "/" });

  const _page = url.searchParams.get("page");
  const page = _page ? Number(_page) : 0;

  const _limit = url.searchParams.get("limit");
  const limit = _limit ? Number(_limit) : COUNT_PER_PAGE;

  return search({ q, page, limit }).then(json);
};

type ResultProps = CommonProps & {
  series?: {
    name: string;
    href: string;
  };
  tags?: string[];
  author?: {
    name: string;
    href: string;
  };
  href: string;
  title: string;
  lastmod: string;
  snippet: string;
  reading_time?: number;
  maxShowHashTags?: number;
};
export const Result = (props: ResultProps) => {
  const maxShowHashTags = props.maxShowHashTags || 3;
  const tooMuchHashTags = (props.tags?.length || 0) - maxShowHashTags;
  const hashtags = props.tags?.slice(0, maxShowHashTags);
  return (
    <div
      className={clsx("relative w-full", props.className)}
      style={props.style}
    >
      <div className="relative space-y-2 text-sm md:text-base">
        <div className="flex items-center gap-2">
          {/* Series */}
          {props.series && (
            <a
              href={props.series.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate"
            >
              {props.series.name}
            </a>
          )}

          {/* Author */}
          {props.author && (
            <>
              <span> — </span>
              <a
                href={props.author.href}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-max"
              >
                {props.author.name}
              </a>
            </>
          )}
        </div>

        {/* Title */}
        <h2 className="truncate pb-1 text-xl font-bold md:text-2xl">
          <a href={props.href} target="_blank" rel="noopener noreferrer">
            {props.title}
          </a>
        </h2>

        {/* Snippet */}
        <div className="text-primary-2 line-clamp-3">
          <time>{props.lastmod} — </time>
          <span dangerouslySetInnerHTML={{ __html: props.snippet }} />
        </div>

        <footer className="flex flex-col gap-2 pt-2">
          {/* Read Time */}
          {props.reading_time && (
            <div className="flex items-center gap-1">
              <Icon.Book className="w-4" />

              <time>{props.reading_time} mins read</time>
            </div>
          )}

          {/* Featured snippet */}
          {hashtags && (
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
          )}
        </footer>
      </div>
    </div>
  );
};

type State = {
  page: number;
  results: SearchResult[];
};
function SearchResults(data: Data) {
  const [{ page, results }, setNextPage] = useState<State>({
    page: 0,
    results: data.result,
  });

  const fetcher = useFetcher<Data>();
  useEffect(() => {
    if (!fetcher.data?.result) return;

    const results = fetcher.data.result;
    setNextPage((state) => ({
      page: state.page + 1,
      results: [...state.results, ...results],
    }));
  }, [fetcher.data?.result, setNextPage]);

  function loadNextPage() {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(COUNT_PER_PAGE),
      q: String(data.query),
    });

    fetcher.load(`/search?${params}`);
  }

  const itemSize = 236;
  const margin = 20;

  const hasNextPage = results.length < data.total;

  const isNextPageLoading = fetcher.state === "loading";

  // If there are more items to be loaded then add an extra row to hold a loading indicator.
  const itemCount = hasNextPage ? results.length + 1 : results.length;

  // Only load 1 page of items at a time.
  // Pass an empty callback to InfiniteLoader in case it asks us to load more than once.
  const loadMoreItems = isNextPageLoading ? noop : loadNextPage;

  // Every row is loaded except for our loading indicator row.
  const isItemLoaded = (index: number) =>
    !hasNextPage || index < results.length;

  return (
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
              itemSize={itemSize + 2 * margin}
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
                    {...applySpec<ResultProps>({
                      series: {
                        name: path(["about_this_result", "series", "name"]),
                        href: path(["about_this_result", "series", "link"]),
                      },
                      author: {
                        name: path(["about_this_result", "author", "name"]),
                        href: path(["about_this_result", "author", "link"]),
                      },
                      tags: path(["about_this_result", "hashtags"]),
                      href: path(["link"]),
                      title: path(["title"]),
                      lastmod: pipe(
                        path(["lastmod"]),
                        (value) => {
                          assert.number(value);
                          return value;
                        },
                        multiply(1000),
                        datefns.toDate,
                        (date) => datefns.format(date, "dd MMM yyyy")
                      ),
                      snippet: path(["snippet"]),
                      reading_time: path(["about_this_result", "reading_time"]),
                    })(results[index])}
                  />
                )
              }
            </List>
          )}
        </InfiniteLoader>
      )}
    </AutoSizer>
  );
}

interface Data {
  query: string;
  result: SearchResult[];
  total: number;
}
const Page = () => {
  const data = useLoaderData<Data>();

  return (
    <div className="flex flex-1 flex-col">
      {/* Number of results found */}
      <p className="my-4 px-4 lg:ml-44 lg:px-0">About {data.total} results</p>

      {/* List of Search Results */}
      <div className="flex-1" key={data.query}>
        <SearchResults {...data} />
      </div>
    </div>
  );
};

export default Page;
