import { useEffect, useRef, useCallback } from "react";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Download function that will be called when the canvas is clicked
  const downloadMeme = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a temporary link element
    const link = document.createElement('a');
    
    // Set the download filename - use template name or a default
    const filename = `${template.name.replace(/\s+/g, '-').toLowerCase()}-meme.png`;
    
    // Convert canvas to data URL and set as link href
    link.href = canvas.toDataURL('image/png');
    link.download = filename;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [template.name]);

  // Helper function to find the best font size for text to fit container
  const findBestFontSize = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxHeight: number, initialFontSize: number) => {
    let fontSize = initialFontSize;
    const minFontSize = 10; // Don't go smaller than this
    const fontWeight = "bold"; // Assuming Impact-like font
    const fontDecrement = 2; // How much to reduce font size in each iteration
    
    // Start with the initial font size and decrease until text fits or min font size reached
    while (fontSize > minFontSize) {
      ctx.font = `${fontWeight} ${fontSize}px Impact, Arial`;
      
      // Check if text fits width
      const words = text.split(" ");
      if (words.length === 0) return { fontSize, lines: [] };
      
      // Check if even a single word is too wide
      for (const word of words) {
        if (ctx.measureText(word).width > maxWidth) {
          // If any single word is too wide, reduce font size immediately
          fontSize -= fontDecrement;
          continue;
        }
      }
      
      const lines = [];
      let currentLine = words[0];
      
      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      
      // Calculate total height needed
      const lineHeight = fontSize * 1.2;
      const totalHeight = lines.length * lineHeight;
      
      // Add more restrictive condition - use 90% of max height as a safety margin
      if (totalHeight <= maxHeight * 0.9) {
        return { fontSize, lines };
      }
      
      // Reduce font size and try again
      fontSize -= fontDecrement;
    }
    
    // Return minimum font size if we get here
    ctx.font = `${fontWeight} ${minFontSize}px Impact, Arial`;
    // Even at minimum font size, ensure we wrap the text properly
    return { fontSize: minFontSize, lines: wrapText(ctx, text, maxWidth) };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Load and draw the meme template
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.src = `/${template.imgUrl}`;

    img.onload = () => {
      // Calculate aspect ratio and set canvas dimensions
      const maxWidth = 400;
      const maxHeight = 400;
      const aspectRatio = img.width / img.height;
      
      let canvasWidth, canvasHeight;
      
      if (aspectRatio > 1) {
        // Image is wider than it is tall
        canvasWidth = Math.min(maxWidth, img.width);
        canvasHeight = canvasWidth / aspectRatio;
      } else {
        // Image is taller than it is wide or square
        canvasHeight = Math.min(maxHeight, img.height);
        canvasWidth = canvasHeight * aspectRatio;
      }
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

      // Draw text overlays using template configuration
      template.text.forEach((textConfig, index) => {
        const text = texts[index];
        if (text && text.trim()) {
          // Set up text styling based on template config
          ctx.fillStyle = textConfig.color;
          ctx.strokeStyle = textConfig.color === "black" ? "white" : "black";
          ctx.lineWidth = 2;
          
          // Calculate initial font size based on template config
          const initialFontSize = Math.round(24 * textConfig.scale_y * 5);
          
          // Calculate the maximum width and height available for this text area
          const maxWidth = canvasWidth * textConfig.scale_x * 0.95; // 95% to leave some margin
          const maxHeight = canvasHeight * textConfig.scale_y * 0.95; // 95% to leave some margin
          
          // Set text alignment
          ctx.textAlign = textConfig.align as CanvasTextAlign;
          ctx.textBaseline = "middle";

          // Calculate position based on anchor points and actual canvas size
          const x = textConfig.anchor_x * canvasWidth + (canvasWidth * textConfig.scale_x / 2);
          const textAreaHeight = canvasHeight * textConfig.scale_y;
          const y = textConfig.anchor_y * canvasHeight + (textAreaHeight / 2);

          // Apply text transformation
          const processedText = textConfig.style === "upper" ? text.toUpperCase() : text;
          
          // Find the best font size and get wrapped lines
          const { fontSize, lines } = findBestFontSize(
            ctx, 
            processedText, 
            maxWidth, 
            maxHeight, 
            initialFontSize
          );
          
          // Update font with best size
          const fontWeight = textConfig.font === "thick" ? "bold" : "normal";
          ctx.font = `${fontWeight} ${fontSize}px Impact, Arial`;

          // Draw each line
          lines.forEach((line, lineIndex) => {
            // Center the text block vertically
            const lineHeight = fontSize * 1.2;
            const totalTextHeight = lines.length * lineHeight;
            const startY = y - (totalTextHeight / 2) + (fontSize / 2);
            const lineY = startY + (lineIndex * lineHeight);
            ctx.strokeText(line, x, lineY);
            ctx.fillText(line, x, lineY);
          });
        }
      });
    };
  }, [template, texts]);

  // Helper function to wrap text
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(" ");
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  return (
    <div className="flex justify-center">
      <canvas
        ref={canvasRef}
        className="border border-gray-300 rounded-lg shadow-lg max-w-full h-auto cursor-pointer"
        width={400}
        height={400}
        style={{ maxWidth: '100%', height: 'auto' }}
        onClick={downloadMeme}
        title="Click to download meme"
      />
    </div>
  );
}
