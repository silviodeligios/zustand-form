import { useRef } from "react";
import { useStore } from "zustand";
import { cartStore, dispatch } from "test/zustand";

export default function AppTest() {
  const renderCount = useRef(0);
  renderCount.current++;

  const items = useStore(cartStore, (s) => s.items);
  const history = useStore(cartStore, (s) => s.history);
  const lastAction = useStore(cartStore, (s) => s.lastAction);

  console.log(`--- RENDER #${renderCount.current} --- items:`, items.length);

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Cart Test (action dispatch)</h1>
      <p style={{ background: "#ffe0e0", padding: 8, borderRadius: 4 }}>
        Render count: <strong>{renderCount.current}</strong> | Last action:{" "}
        <code>{lastAction || "none"}</code>
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => dispatch({ type: "ADD_ITEM", payload: "apple" })}>
          Add Apple
        </button>
        <button onClick={() => dispatch({ type: "ADD_ITEM", payload: "banana" })}>
          Add Banana
        </button>
        <button onClick={() => dispatch({ type: "REMOVE_ITEM", payload: "apple" })}>
          Remove Apple
        </button>
        <button onClick={() => dispatch({ type: "CLEAR" })}>Clear</button>
      </div>

      <h3>Items</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.id} x{item.qty}
          </li>
        ))}
      </ul>

      <h3>History (middleware)</h3>
      <ul>
        {history.map((entry, i) => (
          <li key={i}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}
