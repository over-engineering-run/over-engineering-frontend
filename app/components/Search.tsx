import {
  Form,
  useFetcher,
  useSearchParams,
  useTransition,
} from "@remix-run/react";
import clsx from "clsx";
import { useCombobox } from "downshift";
import { useEffect, useId, useRef, useState } from "react";
import type { CommonProps } from "~/types";
import Icon from "./Icon";

function useIsFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isFocus, setFocus] = useState(false);

  useEffect(() => {
    const focus = () => setFocus(true);
    const blur = () => setFocus(false);

    ref.current?.addEventListener("focus", focus);
    ref.current?.addEventListener("blur", blur);

    return () => {
      ref.current?.removeEventListener("focus", focus);
      ref.current?.removeEventListener("blur", blur);
    };
  }, [setFocus]);

  return [ref, isFocus] as const;
}

interface AutoCompleteResult {
  query: string;
  result: { name: string; type: string }[];
}

function useAutoComplete() {
  const fetcher = useFetcher<AutoCompleteResult>();

  const [resetNextTick, setResetNextTick] = useState(false);

  const [options, setOptions] = useState<AutoCompleteResult["result"]>([]);

  useEffect(() => {
    if (!fetcher.data) return;

    if (resetNextTick) {
      setResetNextTick(false);
      return setOptions([]);
    }

    setOptions(fetcher.data.result);
  }, [fetcher.data, setOptions]);

  function search(q: string) {
    const params = new URLSearchParams({
      q,
      max: String(5),
    });

    fetcher.load(`/api/auto-complete?${params}`);
  }

  function reset() {
    setResetNextTick(true);
  }

  return { options, search, reset };
}

type Props = CommonProps & {
  autoFocus?: boolean;
};
const Search = (props: Props) => {
  const id = useId();
  const [searchParams] = useSearchParams();
  const [ref, isFocus] = useIsFocus<HTMLInputElement>();

  const { options, search, reset } = useAutoComplete();

  const _props = useCombobox({
    id,
    items: options || [],
    initialInputValue: searchParams.get("q") || "",
    itemToString: (item) => item?.name || "",
    onStateChange: (state) => {
      const q = state.inputValue?.trim();

      if (state.type === useCombobox.stateChangeTypes.InputChange) {
        return q ? search(q) : reset();
      }
    },
  });

  useEffect(() => {
    props.autoFocus && ref.current?.focus();
  }, [props.autoFocus]);

  const isOpen = Boolean(_props.isOpen || isFocus) && options?.length;
  const transition = useTransition();
  const canSubmit =
    transition.state === "idle" && Boolean(_props.inputValue.trim());

  return (
    <Form
      action="/search"
      className={clsx(
        "z-10",
        "relative w-full",
        "brightness-95 hocus-within:brightness-100",
        props.className
      )}
      onSubmit={(e) => {
        if (!canSubmit) return e.preventDefault();
        ref.current?.blur();
      }}
    >
      <div
        className={clsx(
          "flex items-center p-3",
          "bg-form",
          "shadow",
          isOpen ? "rounded-t-3xl" : "rounded-3xl",
          isOpen && "shadow-lg shadow-black",
          "hocus:shadow-lg hocus:shadow-black",
          "transition-shadow duration-150 ease-out-sine"
        )}
        {..._props.getComboboxProps()}
      >
        <label {..._props.getLabelProps()} className="sr-only">
          Search
        </label>

        <div className="mr-4">
          <Icon.Search className="ml-0.5 w-6" />
        </div>

        <input
          {..._props.getInputProps({ ref })}
          name="q"
          type="search"
          className="my-1.5 flex-1 bg-transparent"
        />

        {canSubmit && (
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

        {transition.state === "submitting" && <Icon.Loading className="w-8" />}
      </div>

      <div
        {..._props.getMenuProps()}
        className={clsx(
          "absolute w-full rounded-b-3xl bg-form pb-6",
          !isOpen && "hidden",
          "shadow-lg shadow-black"
        )}
      >
        <hr className="mb-4 border-secondary" />

        <ul>
          {options?.map((item, index) => (
            <li
              {..._props.getItemProps({
                key: item.name,
                index,
                item,
              })}
              className={clsx(
                "hocus:contrast-125",
                "aria-selected:contrast-125"
              )}
            >
              <div className="flex items-center gap-4 bg-form px-3 py-1">
                <Icon.Search className="w-6" />

                <span className="mb-1">{item.name}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Form>
  );
};

export default Search;
