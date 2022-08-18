import type { LoaderFunction } from "@remix-run/server-runtime";
import ky from "ky";
import { getSearchParams } from "remix-params-helper";
import { z } from "zod";

const schema = z.object({
  q: z.string(),
  max: z.number(),
});

export const loader: LoaderFunction = ({ request }) => {
  const results = getSearchParams(request, schema);
  if (!results.success) return null;

  return ky
    .get(
      "http://over-engineering-backend-staging.fly.dev/v1/search/auto-complete",
      {
        searchParams: results.data,
      }
    )
    .json();
};
