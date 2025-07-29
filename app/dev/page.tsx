"use client";

import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect, Fragment } from "react";
import { Stage, Layer, Rect, Circle, Text, Image, Transformer } from "react-konva";
import useImage from "use-image";
import type { Stage as KonvaStageType } from "konva/lib/Stage";
 
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
      text: "Very long text that should wrapped and scaled in font size to not overflow its bounding box",
      color: "black",
      maxSize: 50,
    }
  ]
};

export default function DevRoute() {
  const [templateImage] = useImage(dummyMeme.imgUrl);
  const [texts, setTexts] = useState(dummyMeme.texts);
  const konvaCanvasRef = useRef<KonvaStageType>(null);

  const WIDTH = 500;
  const HEIGHT = 500;

  // Helper function to calculate font size that fits in the container with text wrapping
  const calculateFitFontSize = (text: string, maxWidth: number, maxHeight: number, maxFontSize: number) => {

    // Guard against server-side rendering
    if (typeof document === 'undefined') {
      return maxFontSize;
    }

    // Create a additional canvas element just to measure text dimensions
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return maxFontSize;

    // Function to measure wrapped text dimensions
    const measureWrappedText = (fontSize: number) => {
      ctx.font = `bold ${fontSize}px Impact, Arial`;

      const words = text.split(' ');
      let lines = [''];
      let currentLine = 0;

      for (const word of words) {
        const testLine = lines[currentLine] + (lines[currentLine] ? ' ' : '') + word;
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth > maxWidth && lines[currentLine]) {
          lines.push(word);
          currentLine++;
        } else {
          lines[currentLine] = testLine;
        }
      }

      const totalHeight = lines.length * fontSize * 1.2; // Line height multiplier
      return { width: maxWidth, height: totalHeight, lines: lines.length };
    };

    // Binary search for the largest font size that fits
    let low = 1;
    let high = maxFontSize;
    let fontSize = maxFontSize;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const { height } = measureWrappedText(mid);

      if (height <= maxHeight) {
        fontSize = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return fontSize;
  };

  const downloadCanvas = () => {
    // Guard against server-side rendering
    if (typeof document === 'undefined' || !konvaCanvasRef.current) return;
    const uri = konvaCanvasRef.current.toDataURL();
    const link = document.createElement('a');
    link.href = uri;
    link.download = 'open-meme-export.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Stage width={WIDTH} height={HEIGHT} ref={konvaCanvasRef} onClick={() => downloadCanvas()}>
        <Layer>
          <Image
            image={templateImage}
            width={WIDTH}
            height={HEIGHT}
            x={0}
            y={0}
          />
          {texts.map((text, index) => {
            const textWidth = (text.end.x - text.start.x) * WIDTH;
            const textHeight = (text.end.y - text.start.y) * HEIGHT;
            const optimalFontSize = calculateFitFontSize(text.text, textWidth, textHeight, text.maxSize);
            const optimalPlaceholderFontSize = calculateFitFontSize(`Text ${index + 1}`, textWidth, textHeight, 32);

            return (
              <Fragment key={index}>
                <Text
                  key={`text-${index}`}
                  text={text.text}
                  fontSize={optimalFontSize}
                  fill={text.color}
                  x={text.start.x * WIDTH}
                  y={text.start.y * HEIGHT}
                  width={textWidth}
                  height={textHeight}
                  align="center"
                  fontFamily="Impact, Arial"
                  fontStyle="bold"
                  stroke={text.color === "white" ? "black" : "white"}
                  strokeWidth={optimalFontSize * 0.06}
                  verticalAlign="middle"
                  draggable={false}
                  onDragEnd={(e) => {

                    // NOTE: maybe later we want to allow dragging text
                    const newTexts = [...texts];
                    const newStartX = e.target.x() / WIDTH;
                    const newStartY = e.target.y() / HEIGHT;
                    newTexts[index] = {
                      ...newTexts[index],
                      start: { x: newStartX, y: newStartY },
                      end: {
                        x: newStartX + (text.end.x - text.start.x),
                        y: newStartY + (text.end.y - text.start.y),
                      },
                    };
                    setTexts(newTexts);
                  }}
                />
                {/* <Rect
                  key={`area-${index}`}
                  x={text.start.x * WIDTH}
                  y={text.start.y * HEIGHT}
                  width={textWidth}
                  height={textHeight}
                  stroke="blue"
                  strokeWidth={2}
                  dash={[5, 5]}
                  visible={displayHelpers}
                /> */}
                <Text
                  key={`placeholder-${index}`}
                  text={`Text ${index + 1}`}
                  fontSize={optimalPlaceholderFontSize}
                  fill={text.color}
                  x={text.start.x * WIDTH}
                  y={text.start.y * HEIGHT}
                  width={textWidth}
                  height={textHeight}
                  align="center"
                  fontFamily="Impact, Arial"
                  fontStyle="bold"
                  stroke={text.color === "white" ? "black" : "white"}
                  strokeWidth={optimalPlaceholderFontSize * 0.06}
                  verticalAlign="middle"
                  draggable={false}
                  visible={text.text === ""}
                />
              </Fragment>
            );
          })}
        </Layer>
      </Stage>
      {texts.map((text, index) => (
        <Input
          className="mt-2"
          key={index}
          value={text.text}
          onChange={(e) => {
            const newTexts = [...texts];
            newTexts[index] = {
              ...newTexts[index],
              text: e.target.value,
            };
            setTexts(newTexts);
          }}
          placeholder={`Text ${index + 1}`}
        />
      ))}
    </>
  );
}