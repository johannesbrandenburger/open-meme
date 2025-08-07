"use client";

import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect, Fragment } from "react";
import { Stage, Layer, Rect, Circle, Text, Image, Transformer } from "react-konva";
import useImage from "use-image";
import type { Stage as KonvaStageType } from "konva/lib/Stage";
import { MemeCanvas } from "../components/MemeCanvas";

const dummyMeme = {
  _id: "dummy-id",
  name: "Dummy Meme",
  imgUrl: "templates/aag.jpg",
  text: [
    {
      "style": "upper",
      "color": "white",
      "font": "thick",
      "anchor_x": 0,
      "anchor_y": 0,
      "angle": 0,
      "scale_x": 1,
      "scale_y": 0.2,
      "align": "center",
      "start": 0,
      "stop": 1
    },
    {
      "style": "upper",
      "color": "white",
      "font": "thick",
      "anchor_x": 0,
      "anchor_y": 0.8,
      "angle": 0,
      "scale_x": 1,
      "scale_y": 0.2,
      "align": "center",
      "start": 0,
      "stop": 1
    }
  ]
};

const dummyMeme2 = {
  _id: "dummy-id",
  name: "Dummy Meme",
  "imgUrl": "templates/buzz.gif",
  "text": [
    {
      "style": "upper",
      "color": "white",
      "font": "thick",
      "anchor_x": 0,
      "anchor_y": 0,
      "angle": 0,
      "scale_x": 1,
      "scale_y": 0.2,
      "align": "center",
      "start": 0.05,
      "stop": 1
    },
    {
      "style": "upper",
      "color": "white",
      "font": "thick",
      "anchor_x": 0,
      "anchor_y": 0.8,
      "angle": 0,
      "scale_x": 1,
      "scale_y": 0.2,
      "align": "center",
      "start": 0.5,
      "stop": 1
    }
  ],
};

export default function DevRoute() {

  const texts: string[] = [
    "Hello World",
    "Very long text that should wrapped and scaled in font size to not overflow its bounding box",
  ]
  return (
    <div className="space-y-4 sm:space-y-6">
      <MemeCanvas template={dummyMeme} texts={texts} />
      <MemeCanvas template={dummyMeme2} texts={texts} />
    </div>
  )
}