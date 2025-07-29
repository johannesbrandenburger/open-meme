"use client";

import { useState } from "react";
import { Stage, Layer, Rect, Circle, Text, Image, Transformer } from "react-konva";
import useImage from "use-image";

type MemeObject = {
  _id: string;
  imgUrl: string;
  texts: {
    start: {
      x: number;
      y: number;
    };
    end: {
      x: number;
      y: number;
    },
    text: string;
    color: "black" | "white";
    maxSize: number;
  }[];
}

const dummyMeme: MemeObject = {
  _id: "dummy-id",
  imgUrl: "templates/aag.jpg",
  texts: [
    {
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0.2 },
      text: "Hello World",
      color: "white",
      maxSize: 50,
    },
    {
      start: { x: 0, y: 0.8 },
      end: { x: 1, y: 1 },
      text: "Initializing Konva",
      color: "black",
      maxSize: 50,
    }
  ]
};

export default function DevRoute() {

  const [templateImage] = useImage(dummyMeme.imgUrl);
  const [texts, setTexts] = useState(dummyMeme.texts);

  const WIDTH = 500;
  const HEIGHT = 500;

  return (
    <Stage width={WIDTH} height={HEIGHT}>
      <Layer>
        <Image
          image={templateImage}
          width={WIDTH}
          height={HEIGHT}
          x={0}
          y={0}
        />
        {texts.map((text, index) => (
          <Text
            key={index}
            text={text.text}
            fontSize={text.maxSize}
            fill={text.color}
            x={text.start.x * WIDTH}
            y={text.start.y * HEIGHT}
            width={(text.end.x - text.start.x) * WIDTH}
            height={(text.end.y - text.start.y) * HEIGHT}
            align="center"
            draggable
            fontFamily="Impact, Arial"
            fontStyle="bold"
            stroke={text.color === "white" ? "black" : "white"}
            strokeWidth={2}
            verticalAlign="middle"
            textAlign="center"
            onDragEnd={(e) => {
              const newTexts = [...texts];
              const newStartX = e.target.x() / WIDTH;
              const newStartY = e.target.y() / HEIGHT;

              newTexts[index] = {
                ...newTexts[index],
                start: {
                  x: newStartX,
                  y: newStartY,
                },
                end: {
                  x: newStartX + (text.end.x - text.start.x),
                  y: newStartY + (text.end.y - text.start.y),
                },
              };
              console.log(`Text position updated: ${text.text}`, newTexts[index]);
              setTexts(newTexts);
            }}
          />
        ))}
      </Layer>
    </Stage>
  );
}