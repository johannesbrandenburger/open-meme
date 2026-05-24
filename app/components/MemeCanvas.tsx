"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { flushSync } from "react-dom";
import { Stage, Layer, Text, Image as KonvaImage, Rect } from "react-konva";
import useImage from "use-image";
import type { Stage as KonvaStageType } from "konva/lib/Stage";
import { GIFEncoder, applyPalette, quantize } from "gifenc";
import { decompressFrames, parseGIF } from "gifuct-js";
import type { ParsedFrame } from "gifuct-js";

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
  showTextBoxOverlay?: boolean;
}

const MAX_CANVAS_WIDTH = 560;
const MAX_CANVAS_HEIGHT = 560;
const FALLBACK_CANVAS_SIZE = 400;
const MEME_TEXT_FILL = "white";
const MEME_TEXT_STROKE = "#111111";

const getCanvasDimensions = (
  aspectRatio: number,
  availableWidth: number
): { width: number; height: number } => {
  const maxWidth = Math.min(availableWidth || FALLBACK_CANVAS_SIZE, MAX_CANVAS_WIDTH);
  const maxHeight = MAX_CANVAS_HEIGHT;

  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return { width: maxWidth, height: maxWidth };
  }

  let width = maxWidth;
  let height = width / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return { width, height };
};

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
    const words = text.trim().split(/\s+/).filter(Boolean);
    const lines: string[] = [""];

    const pushToken = (token: string, separator = "") => {
      const currentLine = lines[lines.length - 1];
      const testLine = currentLine + (currentLine ? separator : "") + token;

      if (ctx.measureText(testLine).width <= maxWidth) {
        lines[lines.length - 1] = testLine;
        return;
      }

      if (currentLine) {
        lines.push("");
      }

      let charLine = lines[lines.length - 1];

      for (const char of token) {
        const testCharLine = charLine + char;

        if (ctx.measureText(testCharLine).width > maxWidth && charLine) {
          lines[lines.length - 1] = charLine;
          lines.push(char);
          charLine = char;
        } else {
          charLine = testCharLine;
          lines[lines.length - 1] = charLine;
        }
      }
    };

    for (const word of words) {
      if (ctx.measureText(word).width > maxWidth) {
        pushToken(word);
      } else {
        pushToken(word, " ");
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

const bytesToBlobPart = (bytes: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
};

export function MemeCanvas({
  template,
  texts,
  className,
  showPlaceholder = false,
  showTextBoxOverlay = false,
}: MemeCanvasProps) {
  const [templateImage] = useImage("/" + template.imgUrl);
  const konvaCanvasRef = useRef<KonvaStageType>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animatedImageRef = useRef<HTMLImageElement>(null);
  const isDownloadingRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(FALLBACK_CANVAS_SIZE);
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: FALLBACK_CANVAS_SIZE,
    height: FALLBACK_CANVAS_SIZE,
  });
  const [baseFontSizes, setBaseFontSizes] = useState<number[]>([]);
  const [renderPercent, setRenderPercent] = useState(1);
  const [gifDuration, setGifDuration] = useState(2500);
  const [isDownloading, setIsDownloading] = useState(false);
  const isGifTemplate = template.imgUrl.toLowerCase().endsWith(".gif");

  // Track container width for responsive scaling
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
      }
    };

    updateContainerWidth();
    window.addEventListener("resize", updateContainerWidth);
    return () => window.removeEventListener("resize", updateContainerWidth);
  }, []);

  // Calculate canvas dimensions from a consistent presentation box.
  // Intrinsic image dimensions provide only the aspect ratio, not the display cap.
  useEffect(() => {
    if (templateImage && containerWidth) {
      const aspectRatio = templateImage.width / templateImage.height;
      setCanvasDimensions(getCanvasDimensions(aspectRatio, containerWidth));
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
        60
      );
    });

    setBaseFontSizes(sizes);
  }, [templateImage, texts, template.text]);

  useEffect(() => {
    if (!isGifTemplate) {
      setGifDuration(2500);
      return;
    }

    let isCancelled = false;
    void fetch(`/${template.imgUrl}`)
      .then((response) => response.arrayBuffer())
      .then((buffer) => decompressFrames(parseGIF(buffer), true))
      .then((frames) => {
        if (isCancelled) return;
        const duration = frames.reduce((total, frame) => total + (frame.delay || 100), 0);
        setGifDuration(duration || 2500);
      })
      .catch(() => {
        if (!isCancelled) setGifDuration(2500);
      });

    return () => {
      isCancelled = true;
    };
  }, [isGifTemplate, template.imgUrl]);

  useEffect(() => {
    if (!isGifTemplate || !konvaCanvasRef.current) {
      setRenderPercent(1);
      return;
    }

    const layer = konvaCanvasRef.current.getLayers()[0];
    let animationFrame = 0;
    let startedAt = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startedAt) % gifDuration;
      if (!isDownloadingRef.current) {
        setRenderPercent(elapsed / gifDuration);
      }
      layer?.batchDraw();
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame((now) => {
      startedAt = now;
      animate(now);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [gifDuration, isGifTemplate, template.imgUrl, templateImage]);

  const textVisibleAt = (start: number, stop: number) => {
    if (!isGifTemplate) return true;
    if (renderPercent === 1) return stop === 1;
    return start <= renderPercent && (renderPercent < stop || !stop);
  };

  const waitForFrame = () =>
    new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  const drawGifFrame = (ctx: CanvasRenderingContext2D, frame: ParsedFrame) => {
    const patchCanvas = document.createElement("canvas");
    patchCanvas.width = frame.dims.width;
    patchCanvas.height = frame.dims.height;
    const patchCtx = patchCanvas.getContext("2d");
    if (!patchCtx) return;

    const imageData = new ImageData(frame.patch, frame.dims.width, frame.dims.height);
    patchCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);
  };

  const encodeFrame = (
    gif: ReturnType<typeof GIFEncoder>,
    canvas: HTMLCanvasElement,
    delay: number
  ) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const palette = quantize(data, 256, { format: "rgb565" });
    const index = applyPalette(data, palette, "rgb565");

    gif.writeFrame(index, width, height, {
      palette,
      delay,
      repeat: 0,
    });
  };

  const downloadCanvas = async () => {
    if (typeof document === "undefined" || !konvaCanvasRef.current) return;
    isDownloadingRef.current = true;
    setIsDownloading(true);

    const stage = konvaCanvasRef.current;
    const gif = GIFEncoder();

    try {
      if (isGifTemplate) {
        const sourceGif = await fetch(`/${template.imgUrl}`)
          .then((response) => response.arrayBuffer())
          .then((buffer) => decompressFrames(parseGIF(buffer), true));
        const frameCanvas = document.createElement("canvas");
        frameCanvas.width = templateImage?.width || canvasDimensions.width;
        frameCanvas.height = templateImage?.height || canvasDimensions.height;
        const frameCtx = frameCanvas.getContext("2d", { willReadFrequently: true });
        if (!frameCtx) return;

        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = canvasDimensions.width;
        exportCanvas.height = canvasDimensions.height;
        const exportCtx = exportCanvas.getContext("2d", { willReadFrequently: true });
        if (!exportCtx) return;
        const totalDuration = sourceGif.reduce(
          (total, frame) => total + (frame.delay || 100),
          0
        );
        let elapsedDuration = 0;

        for (let frameIndex = 0; frameIndex < sourceGif.length; frameIndex += 1) {
          const sourceFrame = sourceGif[frameIndex];
          const previousFrame = frameCtx.getImageData(
            0,
            0,
            frameCanvas.width,
            frameCanvas.height
          );
          flushSync(() => {
            setRenderPercent(
              sourceGif.length === 1 || !totalDuration
                ? 1
                : elapsedDuration / totalDuration
            );
          });
          await waitForFrame();
          stage.draw();

          drawGifFrame(frameCtx, sourceFrame);

          const stageCanvas = stage.toCanvas({ pixelRatio: 1 });
          exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
          exportCtx.drawImage(
            frameCanvas,
            0,
            0,
            exportCanvas.width,
            exportCanvas.height
          );
          exportCtx.drawImage(stageCanvas, 0, 0);

          encodeFrame(gif, exportCanvas, sourceFrame.delay || 100);
          elapsedDuration += sourceFrame.delay || 100;

          if (sourceFrame.disposalType === 2) {
            frameCtx.clearRect(
              sourceFrame.dims.left,
              sourceFrame.dims.top,
              sourceFrame.dims.width,
              sourceFrame.dims.height
            );
          } else if (sourceFrame.disposalType === 3) {
            frameCtx.putImageData(previousFrame, 0, 0);
          }
        }
      } else {
        setRenderPercent(1);
        await waitForFrame();
        stage.draw();
        encodeFrame(gif, stage.toCanvas({ pixelRatio: 1 }), 100);
      }

      gif.finish();
    } finally {
      isDownloadingRef.current = false;
      if (!isGifTemplate) setRenderPercent(1);
      setIsDownloading(false);
    }

    const blob = new Blob([bytesToBlobPart(gif.bytes())], { type: "image/gif" });
    const uri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = uri;
    link.download = "open-meme-export.gif";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(uri);
  };

  return (
    <div ref={containerRef} className={`flex items-center justify-center w-full ${className || ""}`}>
      <div
        className={`relative overflow-hidden rounded-lg border border-border bg-card shadow-md transition-transform hover:scale-[1.01] ${isDownloading ? "opacity-75" : ""}`}
        style={{
          width: canvasDimensions.width,
          height: canvasDimensions.height,
          maxWidth: "100%",
        }}
        onClick={downloadCanvas}
      >
        {isGifTemplate && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={animatedImageRef}
            src={`/${template.imgUrl}`}
            alt=""
            className="absolute inset-0 size-full object-fill"
            draggable={false}
          />
        )}
        <Stage
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          ref={konvaCanvasRef}
          className={`${isGifTemplate ? "absolute inset-0" : ""} h-auto max-w-full cursor-pointer`}
        >
          <Layer>
            {!isGifTemplate && (
              <KonvaImage
                image={templateImage}
                width={canvasDimensions.width}
                height={canvasDimensions.height}
                x={0}
                y={0}
              />
            )}
            {template.text.map((t, i) => {
              const scaleFactor =
                templateImage && templateImage.width
                  ? canvasDimensions.width / templateImage.width
                  : 1;
              const fontSize =
                baseFontSizes[i] !== undefined
                  ? baseFontSizes[i] * scaleFactor
                  : 16;
              const hasLongToken = texts[i]?.split(/\s+/).some((token) => token.length > 18);

              return (
                <Fragment key={i}>
                  {showTextBoxOverlay && (
                    <Rect
                      x={t.anchor_x * canvasDimensions.width}
                      y={t.anchor_y * canvasDimensions.height}
                      width={t.scale_x * canvasDimensions.width}
                      height={t.scale_y * canvasDimensions.height}
                      fill="rgba(59, 130, 246, 0.12)"
                      stroke="rgba(59, 130, 246, 0.85)"
                      strokeWidth={Math.max(1, 2 * scaleFactor)}
                      dash={[6 * scaleFactor, 4 * scaleFactor]}
                      listening={false}
                    />
                  )}
                  {textVisibleAt(t.start, t.stop) && (
                    <Text
                      text={texts[i]}
                      fontSize={fontSize}
                      fill={MEME_TEXT_FILL}
                      x={t.anchor_x * canvasDimensions.width}
                      y={t.anchor_y * canvasDimensions.height}
                      width={t.scale_x * canvasDimensions.width}
                      height={t.scale_y * canvasDimensions.height}
                      align="center"
                      fontFamily="Impact, Arial"
                      fontStyle="bold"
                      stroke={MEME_TEXT_STROKE}
                      strokeWidth={fontSize * 0.06}
                      verticalAlign="middle"
                      wrap={hasLongToken ? "char" : "word"}
                      draggable={false}
                    />
                  )}
                  {showPlaceholder && !texts[i] && (
                    <Text
                      text={`Text ${i + 1}`}
                      fontSize={fontSize}
                      fill={MEME_TEXT_FILL}
                      opacity={0.55}
                      x={t.anchor_x * canvasDimensions.width}
                      y={t.anchor_y * canvasDimensions.height}
                      width={t.scale_x * canvasDimensions.width}
                      height={t.scale_y * canvasDimensions.height}
                      align="center"
                      fontFamily="Impact, Arial"
                      fontStyle="bold"
                      stroke={MEME_TEXT_STROKE}
                      strokeWidth={fontSize * 0.06}
                      verticalAlign="middle"
                      wrap="word"
                      draggable={false}
                    />
                  )}
                </Fragment>
              );
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
