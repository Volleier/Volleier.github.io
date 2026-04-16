import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div className="mt-4 text-center">
      <button
        className="px-3 py-1 rounded bg-indigo-600 text-white"
        onClick={() => setCount((c) => c + 1)}
      >
        闁绘劗鎳撻崵顕€骞?({count})
      </button>
    </div>
  );
}
