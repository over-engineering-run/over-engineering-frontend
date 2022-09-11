import type { LoaderFunction } from "@remix-run/server-runtime";
import { getSearchParams } from "remix-params-helper";
import { z } from "zod";
import api from "~/utils/api";

const schema = z.object({
  q: z.string(),
  max: z.number(),
});

export const loader: LoaderFunction = ({ request }) => {
  const results = getSearchParams(request, schema);
  if (!results.success) return null;

  return api
    .get("docs/v1/search/auto-complete", {
      searchParams: results.data,
    })
    .json();
};
