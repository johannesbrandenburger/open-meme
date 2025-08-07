/*
- the meme templates are already in a folder: `./memegen/templates`, each named after the meme
  - `./memegen/templates/<meme-name>/default.jpg`
    - the image for the meme
  - `./memegen/templates/<meme-name>/config.yml`
    - the information about the slots to fill in (in yaml: "text")
    - example for <meme-name>: "blb"
      ```yaml
      name: Bad Luck Brian
      source: http://knowyourmeme.com/memes/bad-luck-brian
      text:
        - style: upper
          color: white
          font: thick
          anchor_x: 0.0
          anchor_y: 0.0
          angle: 0.0
          scale_x: 1.0
          scale_y: 0.2
          align: center
          start: 0.0
          stop: 1.0
        - style: upper
          color: white
          font: thick
          anchor_x: 0.0
          anchor_y: 0.8
          angle: 0.0
          scale_x: 1.0
          scale_y: 0.2
          align: center
          start: 0.0
          stop: 1.0
      example:
        - falls asleep in class
        - has a wet dream
      ```
 */

console.log("Initializing meme template copy...");

import fs from "fs";
import path from "path";
import { parse } from 'yaml'

// read all the subdirectories from "memegen/templates"
(async () => {
  const templatesDir = path.join("memegen", "templates");
  const templateNames = await fs.promises.readdir(templatesDir, { withFileTypes: true });

  // filter out only directories and ignore _* directories
  const templates = templateNames
    .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith("_"))
    .map(dirent => dirent.name);

  console.log("Available meme templates:", templates);

  let allMemes: {
    name: string;
    imgUrl: string;
    source: string;
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
    example: string[];
  }[] = [];

  // iterate over each template directory to fill the allMemes array (skip memes which do not have a config.yml or default image)
  for (const template of templates) {
    const templatePath = path.join(templatesDir, template);
    const configPath = path.join(templatePath, "config.yml");
    
    // Check for supported image formats
    const supportedFormats = ['jpg', 'png', 'gif'];
    let imgPath = '';
    let imgFormat = '';
    
    for (const format of supportedFormats) {
      const formatPath = path.join(templatePath, `default.${format}`);
      if (fs.existsSync(formatPath)) {
        imgPath = formatPath;
        imgFormat = format;
        break;
      }
    }

    if (!fs.existsSync(configPath) || !imgPath) {
      console.warn(`Skipping ${template}: missing config.yml or default image (jpg/png/gif)`);
      continue;
    }

    // read the config.yml file
    const configContent = fs.readFileSync(configPath, "utf-8");
    const config = parse(configContent);

    // TEMP: skip memes with >500kb image size
    const imgStats = fs.statSync(imgPath);
    if (imgStats.size > 700 * 1024) {
      console.warn(`Skipping ${template}: image size > 500kb (${imgStats.size} bytes)`);
      continue;
    }

    allMemes.push({
      name: config.name,
      imgUrl: `templates/${template}.${imgFormat}`,
      source: config.source,
      text: config.text,
      example: config.example,
    });

    // copy the default image to public/templates/<template>.<format>
    const publicTemplatesDir = path.join("public", "templates");
    if (!fs.existsSync(publicTemplatesDir)) {
      fs.mkdirSync(publicTemplatesDir, { recursive: true });
    }
    const destImgPath = path.join(publicTemplatesDir, `${template}.${imgFormat}`);
    fs.copyFileSync(imgPath, destImgPath);

    console.log(`Loaded meme template: ${config.name} (${template}.${imgFormat})`);
  }

  // write the allMemes array to a JSON file in convex/memes.json
  const outputPath = path.join("convex", "templates.json");
  await fs.promises.writeFile(outputPath, JSON.stringify(allMemes, null, 2));
  console.log(`Meme templates saved to ${outputPath}`);

  // stats
  console.log(`Total memes loaded: ${allMemes.length}`);
})()