import { useState } from "react";

const DescriptionCell = ({ text = "" }) => {
  const [expanded, setExpanded] = useState(false);
  const limit = 150;

  const isLong = text.length > limit;
  const displayedText = expanded ? text : text.slice(0, limit);

  return (
    <td className="px-4 py-2 max-w-[700px] w-full break-words">
      {text ? (
        <>
          {displayedText}
          {isLong && !expanded && "... "}
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-emerald-600 underline ml-1"
            >
              {expanded ? "Gizle" : "Devamını oku"}
            </button>
          )}
        </>
      ) : (
        "—"
      )}
    </td>
  );
};

export default DescriptionCell;
