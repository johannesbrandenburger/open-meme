"use client";

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

export default function DevRoute() {

  const texts: string[] = [
    "Hello World",
    "Verylongtextthatshouldwrappedandscaledinfontsizetonotoverflowitsboundingbox",
  ]
  return (
    <div className="space-y-4 sm:space-y-6">
      <MemeCanvas template={dummyMeme} texts={texts} />
    </div>
  )
}