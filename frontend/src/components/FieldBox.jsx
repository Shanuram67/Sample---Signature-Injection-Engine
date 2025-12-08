import React from "react";
import FieldBox from "./FieldBox";

const FieldLayer = ({ pageMeta, scale, fields, onUpdateField, onStartSign }) => {
  const viewportHeightPx = pageMeta.heightPt * scale;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {fields.map((field) => {
        const leftPx = field.x * scale;
        const widthPx = field.width * scale;
        const heightPx = field.height * scale;

        const bottomPx = field.y * scale;
        const topPx = viewportHeightPx - (bottomPx + heightPx);

        return (
          <FieldBox
            key={field.id}
            field={field}
            leftPx={leftPx}
            topPx={topPx}
            widthPx={widthPx}
            heightPx={heightPx}
            scale={scale}
            pageMeta={pageMeta}
            viewportHeightPx={viewportHeightPx}
            onUpdateField={onUpdateField}
            onStartSign={onStartSign}
          />
        );
      })}
    </div>
  );
};

export default FieldLayer;
