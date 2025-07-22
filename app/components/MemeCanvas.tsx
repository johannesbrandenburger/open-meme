import { useEffect, useRef } from "react";

interface MemeCanvasProps {
  template: any; // TODO: 
  texts: string[];
}

export function MemeCanvas({ template, texts }: MemeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Load and draw the meme template
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    // Use the new Convex endpoint to load the template image
    img.src = `${template.imgUrl}`;
    
    img.onload = () => {
      // Draw the image
      canvas.width = 400;
      canvas.height = 400;
      ctx.drawImage(img, 0, 0, 400, 400);

      // Set up text styling
      ctx.fillStyle = "white";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.font = "bold 24px Impact, Arial";
      ctx.textAlign = "center";

      // Draw text overlays
      texts.forEach((text, index) => {
        if (text.trim()) {
          const y = index === 0 ? 50 : 350; // Top and bottom positioning
          const lines = wrapText(ctx, text.toUpperCase(), 380);
          
          lines.forEach((line, lineIndex) => {
            const lineY = y + (lineIndex * 30);
            ctx.strokeText(line, 200, lineY);
            ctx.fillText(line, 200, lineY);
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
        className="border border-gray-300 rounded-lg shadow-lg max-w-full h-auto"
        width={400}
        height={400}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}
