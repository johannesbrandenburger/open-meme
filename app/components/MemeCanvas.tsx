"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { Stage, Layer, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import type { Stage as KonvaStageType } from "konva/lib/Stage";

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
  className?: string;
  showPlaceholder?: boolean;
}

// Helper: calculate font size once for a reference size
const calculateBaseFontSize = (
  text: string,
  maxWidth: number,
  maxHeight: number,
  maxFontSize: number
) => {
  if (typeof document === "undefined") return maxFontSize;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return maxFontSize;

  const measureWrappedText = (fontSize: number) => {
    ctx.font = `bold ${fontSize}px Impact, Arial`;
    const words = text.split(" ");
    let lines: string[] = [""];
    let currentLine = 0;

    for (const word of words) {
      const testLine =
        lines[currentLine] + (lines[currentLine] ? " " : "") + word;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxWidth && lines[currentLine]) {
        lines.push(word);
        currentLine++;
      } else {
        lines[currentLine] = testLine;
      }
    }

    return lines.length * fontSize * 1.2; // height
  };

  let low = 1;
  let high = maxFontSize;
  let fontSize = maxFontSize;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const height = measureWrappedText(mid);

    if (height <= maxHeight) {
      fontSize = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return fontSize;
};

export function MemeCanvas({
  template,
  texts,
  className,
  showPlaceholder = false,
}: MemeCanvasProps) {
  const [templateImage] = useImage("/" + template.imgUrl);
  const konvaCanvasRef = useRef<KonvaStageType>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(400);
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 400,
    height: 400,
  });
  const [baseFontSizes, setBaseFontSizes] = useState<number[]>([]);

  // Track container width for responsive scaling
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(Math.min(width, 500)); // Cap at 500px max
      }
    };

    updateContainerWidth();
    window.addEventListener("resize", updateContainerWidth);
    return () => window.removeEventListener("resize", updateContainerWidth);
  }, []);

  // Calculate canvas dimensions based on image aspect ratio and container width
  useEffect(() => {
    if (templateImage && containerWidth) {
      const aspectRatio = templateImage.width / templateImage.height;
      const maxWidth = containerWidth;
      const maxHeight = 500; // Maximum height constraint

      let width, height;

      if (aspectRatio > 1) {
        width = Math.min(maxWidth, templateImage.width);
        height = width / aspectRatio;
      } else {
        height = Math.min(maxHeight, templateImage.height);
        width = height * aspectRatio;

        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }
      }

      setCanvasDimensions({ width, height });
    }
  }, [templateImage, containerWidth]);

  // Calculate base font sizes once at natural image resolution
  useEffect(() => {
    if (!templateImage) return;

    const refWidth = templateImage.width;
    const refHeight = templateImage.height;

    const sizes = template.text.map((t, i) => {
      const textWidth = t.scale_x * refWidth;
      const textHeight = t.scale_y * refHeight;
      return calculateBaseFontSize(
        texts[i] || `Text ${i + 1}`,
        textWidth,
        textHeight,
        200
      );
    });

    setBaseFontSizes(sizes);
  }, [templateImage, texts, template.text]);

  const downloadCanvas = () => {
    if (typeof document === "undefined" || !konvaCanvasRef.current) return;
    const uri = konvaCanvasRef.current.toDataURL();
    const link = document.createElement("a");
    link.href = uri;
    link.download = "open-meme-export.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center w-full ${className || ""
        }`}
    >
      <Stage
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        ref={konvaCanvasRef}
        onClick={downloadCanvas}
        className="max-w-full h-auto cursor-pointer transition-transform hover:scale-105 border border-border/60 rounded-lg shadow-lg bg-card"
      >
        <Layer>
          <KonvaImage
            image={templateImage}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            x={0}
            y={0}
          />
          {template.text.map((t, i) => {
            const scaleFactor =
              templateImage && templateImage.width
                ? canvasDimensions.width / templateImage.width
                : 1;
            const fontSize =
              baseFontSizes[i] !== undefined
                ? baseFontSizes[i] * scaleFactor
                : 16;

            return (
              <Fragment key={i}>
                <Text
                  text={texts[i]}
                  fontSize={fontSize}
                  fill={t.color}
                  x={t.anchor_x * canvasDimensions.width}
                  y={t.anchor_y * canvasDimensions.height}
                  width={t.scale_x * canvasDimensions.width}
                  height={t.scale_y * canvasDimensions.height}
                  align="center"
                  fontFamily="Impact, Arial"
                  fontStyle="bold"
                  stroke={t.color === "white" ? "black" : "white"}
                  strokeWidth={fontSize * 0.06}
                  verticalAlign="middle"
                  draggable={false}
                />
                {showPlaceholder && !texts[i] && (
                  <Text
                    text={`Text ${i + 1}`}
                    fontSize={fontSize}
                    fill={t.color}
                    x={t.anchor_x * canvasDimensions.width}
                    y={t.anchor_y * canvasDimensions.height}
                    width={t.scale_x * canvasDimensions.width}
                    height={t.scale_y * canvasDimensions.height}
                    align="center"
                    fontFamily="Impact, Arial"
                    fontStyle="bold"
                    stroke={t.color === "white" ? "black" : "white"}
                    strokeWidth={fontSize * 0.06}
                    verticalAlign="middle"
                    draggable={false}
                  />
                )}
              </Fragment>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}