import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div className="mt-4 text-center">
      <button
        className="px-3 py-1 rounded bg-indigo-600 text-white"
        onClick={() => setCount((c) => c + 1)}
      >
        点击我 ({count})
      </button>
    </div>
  );
}
