"use client";

import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect, Fragment } from "react";
import { Stage, Layer, Rect, Circle, Text, Image, Transformer } from "react-konva";
import useImage from "use-image";
import type { Stage as KonvaStageType } from "konva/lib/Stage";

// {
//     "name": "Ancient Aliens Guy",
//     "imgUrl": "templates/aag.jpg",
//     "source": "http://knowyourmeme.com/memes/ancient-aliens",
//     "text": [
//       {
//         "style": "upper",
//         "color": "white",
//         "font": "thick",
//         "anchor_x": 0,
//         "anchor_y": 0,
//         "angle": 0,
//         "scale_x": 1,
//         "scale_y": 0.2,
//         "align": "center",
//         "start": 0,
//         "stop": 1
//       },
//       {
//         "style": "upper",
//         "color": "white",
//         "font": "thick",
//         "anchor_x": 0,
//         "anchor_y": 0.8,
//         "angle": 0,
//         "scale_x": 1,
//         "scale_y": 0.2,
//         "align": "center",
//         "start": 0,
//         "stop": 1
//       }
//     ],
//     "example": [
//       "",
//       "aliens"
//     ]
//   },

interface MemeCanvasProps {
  template: {
    name: string;
    imgUrl: string;
    text: {
      style: string;
      color: string;
      font: string;
      anchor_x: number;
      anchor_y: number;
      angle: number;
      scale_x: number;
      scale_y: number;
      align: string;
      start: number;
      stop: number;
    }[];
  };

  texts: string[];
}

export function MemeCanvas({ template, texts }: MemeCanvasProps) {

  const [templateImage] = useImage("/" + template.imgUrl);
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
      <Stage width={WIDTH} height={HEIGHT} ref={konvaCanvasRef} onClick={() => downloadCanvas()}>
        <Layer>
          <Image
            image={templateImage}
            width={WIDTH}
            height={HEIGHT}
            x={0}
            y={0}
          />
          {template.text.map((text, index) => {
            const textWidth = (text.scale_x) * WIDTH;
            const textHeight = (text.scale_y) * HEIGHT;
            const optimalFontSize = calculateFitFontSize(texts[index], textWidth, textHeight, 32);
            const optimalPlaceholderFontSize = calculateFitFontSize(`Text ${index + 1}`, textWidth, textHeight, 32);

            return (
              <Fragment key={index}>
                <Text
                  key={`text-${index}`}
                  text={texts[index]}
                  fontSize={optimalFontSize}
                  fill={text.color}
                  x={text.anchor_x * WIDTH}
                  y={text.anchor_y * HEIGHT}
                  width={textWidth}
                  height={textHeight}
                  align="center"
                  fontFamily="Impact, Arial"
                  fontStyle="bold"
                  stroke={text.color === "white" ? "black" : "white"}
                  strokeWidth={optimalFontSize * 0.06}
                  verticalAlign="middle"
                  draggable={false}
                />
                {/* <Rect
                  key={`area-${index}`}
                  x={text.anchor_x * WIDTH}
                  y={text.anchor_y * HEIGHT}
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
                  x={text.anchor_x * WIDTH}
                  y={text.anchor_y * HEIGHT}
                  width={textWidth}
                  height={textHeight}
                  align="center"
                  fontFamily="Impact, Arial"
                  fontStyle="bold"
                  stroke={text.color === "white" ? "black" : "white"}
                  strokeWidth={optimalPlaceholderFontSize * 0.06}
                  verticalAlign="middle"
                  draggable={false}
                  visible={texts[index] === ""}
                />
              </Fragment>
            );
          })}
        </Layer>
      </Stage>
  );
}
