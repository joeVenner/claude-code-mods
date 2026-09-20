/**
 * State for the search box, which lives in two places at once: the input (instant, raw) and the
 * URL (debounced, normalized). This reducer keeps them from fighting.
 *
 * The problem it solves: after the input writes `q=abc` and then `q=abcd`, the router can report
 * the intermediate `abc` back late. Treating that as an outside navigation would overwrite what
 * the person is typing. So every query we write is remembered in `inFlightQueries`, and a URL
 * change matching one of them is an echo of our own write, not a navigation to obey.
 */
export interface QueryState {
  /** What the text field shows. Raw, updated on every keystroke. */
  readonly input: string;
  /** The normalized query the results reflect. Updated when a write is committed. */
  readonly applied: string;
  /** The last URL query the reducer has processed. */
  readonly seenUrlQuery: string;
  /** Queries we wrote that the URL has not yet reported back, oldest first. */
  readonly inFlightQueries: readonly string[];
}

export type QueryAction =
  | { readonly type: "typed"; readonly value: string }
  | { readonly type: "committed"; readonly query: string }
  | { readonly type: "urlChanged"; readonly urlQuery: string };

export function createQueryState(urlQuery: string): QueryState {
  return { input: urlQuery, applied: urlQuery, seenUrlQuery: urlQuery, inFlightQueries: [] };
}

export function queryReducer(state: QueryState, action: QueryAction): QueryState {
  switch (action.type) {
    case "typed":
      return { ...state, input: action.value };

    case "committed": {
      // Writing what the URL already holds produces no echo, so there is nothing to wait for.
      const isNoop = action.query === state.seenUrlQuery && state.inFlightQueries.length === 0;
      return {
        ...state,
        applied: action.query,
        inFlightQueries: isNoop ? state.inFlightQueries : [...state.inFlightQueries, action.query],
      };
    }

    case "urlChanged": {
      if (action.urlQuery === state.seenUrlQuery) return state;
      const echoIndex = state.inFlightQueries.lastIndexOf(action.urlQuery);
      if (echoIndex >= 0) {
        // Echo of our own write. Older in-flight writes were superseded, so drop them too.
        return {
          ...state,
          seenUrlQuery: action.urlQuery,
          inFlightQueries: state.inFlightQueries.slice(echoIndex + 1),
        };
      }
      // Someone else changed the URL (a nav link, back/forward): the URL wins.
      return createQueryState(action.urlQuery);
    }
  }
}
