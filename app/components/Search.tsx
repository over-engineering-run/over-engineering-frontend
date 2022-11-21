import {
  Form,
  useFetcher,
  useSearchParams,
  useTransition,
} from "@remix-run/react";
import clsx from "clsx";
import { useCombobox } from "downshift";
import { descend, eqProps, pipe, prepend, prop, sortBy, uniqWith } from "ramda";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useLocalStorage } from "react-use";
import { ClientOnly } from "remix-utils";
import type { CommonProps } from "~/types";
import Icon from "./Icon";

interface Record {
  name: string;
  type: string;
}
interface History extends Record {
  created_at: number;
}

function useHistory() {
  const [_options, setHistory] = useLocalStorage<History[]>(
    "search-history",
    [],
    {
      raw: false,
      serializer: JSON.stringify,
      deserializer: JSON.parse,
    }
  );
  const options = _options?.slice(0, 5) || [];

  options.sort((a, b) => b.created_at - a.created_at);

  const append = (query: string) =>
    setHistory(
      //@ts-ignore
      pipe(
        prepend({ type: "history", name: query, created_at: Date.now() }),
        uniqWith(eqProps("name")),
        //@ts-ignore
        sortBy(descend(prop("created_at")))
      )(options)
    );

  return { options, append };
}

interface AutoCompleteResult {
  query: string;
  result: Record[];
}
function useAutoComplete() {
  const fetcher = useFetcher<AutoCompleteResult>();
  const [options, setOptions] = useState<Record[]>([]);

  useEffect(() => {
    if (!fetcher.data) return;

    setOptions(fetcher.data.result);
  }, [fetcher.data, setOptions]);

  function search(q: string) {
    const params = new URLSearchParams({
      q,
      max: String(5),
    });

    fetcher.load(`/api/auto-complete?${params}`);
  }

  return { options, search };
}

const { InputChange } = useCombobox.stateChangeTypes;

function useSearchBar() {
  const ref = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(useSearchParams()[0].get("q") || "");

  const history = useHistory();
  const autoComplete = useAutoComplete();
  const items = query ? autoComplete.options : history.options;

  const props = useCombobox({
    id: useId(),
    items,
    initialInputValue: query,
    itemToString: (item) => item?.name || "",
    onInputValueChange: ({ inputValue }) => setQuery(inputValue?.trim() || ""),
    onStateChange: (state) => {
      if (state.type === InputChange) {
        const query = state.inputValue?.trim();

        return query && autoComplete.search(query);
      }
    },
  });

  const transition = useTransition();

  const canSubmit = transition.state === "idle" && query;
  const onSubmit = (e: FormEvent) => {
    if (!canSubmit) return e.preventDefault();

    history.append(query);

    ref.current?.blur();
  };

  return {
    ...props,
    ref,
    canSubmit,
    onSubmit,
    query,
    transition,
    options: items,
    isOpen: props.isOpen && items.length,
  };
}

type Props = CommonProps & {
  autoFocus?: boolean;
};
const Search = (props: Props) => {
  const form = useSearchBar();

  useEffect(() => {
    if (props.autoFocus) {
      form.ref.current?.focus();
    }
  }, [props.autoFocus, form.ref]);

  return (
    <Form
      action="/search"
      className={clsx(
        "z-10",
        "relative w-full",
        "brightness-95 hocus-within:brightness-100",
        props.className
      )}
      onSubmit={form.onSubmit}
      onFocus={form.openMenu}
      onBlur={() => setTimeout(form.closeMenu, 100)}
    >
      <div
        {...form.getComboboxProps()}
        className={clsx(
          "flex items-center p-3",
          "bg-form",
          "shadow",
          form.isOpen ? "rounded-t-3xl" : "rounded-3xl",
          form.isOpen && "shadow-lg shadow-black",
          "hocus:shadow-lg hocus:shadow-black",
          "transition-shadow duration-150 ease-out-sine"
        )}
      >
        <label {...form.getLabelProps()} className="sr-only">
          Search
        </label>

        <div className="mr-4">
          <Icon.Search className="ml-0.5 w-6" />
        </div>

        <input
          {...form.getInputProps({ ref: form.ref })}
          name="q"
          type="search"
          className="my-1.5 flex-1 bg-transparent"
        />

        {form.canSubmit && (
          <button
            type="submit"
            className={clsx(
              "border-l border-secondary",
              "w-max whitespace-nowrap p-1 px-4",
              "flex items-center",
              "font-semibold text-primary-2"
            )}
          >
            <span className="hidden lg:block">
              SUBMIT OR PRESS <kbd>↵</kbd>
            </span>
            <span className="lg:hidden">SEARCH</span>
          </button>
        )}

        {form.transition.state === "submitting" && (
          <Icon.Loading className="w-8" />
        )}
      </div>

      <div
        {...form.getMenuProps()}
        className={clsx(
          "absolute w-full rounded-b-3xl bg-form pb-4",
          !form.isOpen && "hidden",
          "shadow-lg shadow-black"
        )}
      >
        <hr className="mb-4 border-secondary" />

        <ClientOnly>
          {() => (
            <ul>
              {form.options?.map((item, index) => (
                <li key={item.name}>
                  <div
                    className={clsx(
                      "cursor-pointer",
                      "hocus:contrast-125",
                      "aria-selected:contrast-125",
                      "flex items-center gap-4 bg-form px-3 py-1"
                    )}
                    {...form.getItemProps({
                      key: item.name,
                      index,
                      item,
                    })}
                  >
                    {item.type === "history" ? (
                      <Icon.History className="w-6 pointer-events-none" />
                    ) : (
                      <Icon.Search className="w-6 pointer-events-none" />
                    )}

                    <span className="mb-1 pointer-events-none">{item.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ClientOnly>
      </div>
    </Form>
  );
};

export default Search;
