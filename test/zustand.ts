import { createStore } from "zustand";

export type CartItem = { id: string; qty: number };

type CartState = {
  items: CartItem[];
  history: string[];
  lastAction: string | null;
};

type CartAction =
  | { type: "ADD_ITEM"; payload: string }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "CLEAR" };

const reducer = (state: CartState, action: CartAction): CartState => {
  const entry = `${action.type}${"payload" in action ? ` ${action.payload}` : ""}`;
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.payload);
      const items = existing
        ? state.items.map((i) =>
            i.id === action.payload ? { ...i, qty: i.qty + 1 } : i,
          )
        : [...state.items, { id: action.payload, qty: 1 }];
      return {
        items,
        history: [...state.history, entry],
        lastAction: entry,
      };
    }
    case "REMOVE_ITEM": {
      const items = state.items
        .map((i) =>
          i.id === action.payload ? { ...i, qty: i.qty - 1 } : i,
        )
        .filter((i) => i.qty > 0);
      return {
        items,
        history: [...state.history, entry],
        lastAction: entry,
      };
    }
    case "CLEAR":
      return {
        items: [],
        history: [...state.history, entry],
        lastAction: entry,
      };
    default:
      return state;
  }
};

export const cartStore = createStore<CartState>(() => ({
  items: [],
  history: [],
  lastAction: null,
}));

export function dispatch(action: CartAction) {
  cartStore.setState((state) => reducer(state, action));
}
