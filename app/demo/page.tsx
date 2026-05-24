"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shuffle, Wand2 } from "lucide-react";
import templates from "@/convex/templates.json";
import { MemeCanvas } from "../components/MemeCanvas";

type MemeTemplate = (typeof templates)[number];

type TemplateOption = {
  template: MemeTemplate;
  index: number;
};

const gifFirstIndex = templates.findIndex((template) =>
  template.imgUrl.toLowerCase().endsWith(".gif")
);

const templateOptions: TemplateOption[] = templates.map((template, index) => ({
  template,
  index,
}));

function getInitialTexts(template: MemeTemplate) {
  return template.text.map((_, index) => template.example?.[index] ?? "");
}

function getTemplateSearchText(template: MemeTemplate) {
  return [
    template.name,
    template.imgUrl,
    template.source,
    ...(template.example ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getFilteredTemplates(searchQuery: string) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (!normalizedQuery) return templateOptions;

  return templateOptions.filter(({ template }) =>
    getTemplateSearchText(template).includes(normalizedQuery)
  );
}

export default function DemoPage() {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(
    gifFirstIndex >= 0 ? gifFirstIndex : 0
  );
  const [texts, setTexts] = useState(() => getInitialTexts(templates[selectedIndex]));

  const selectedTemplate = templates[selectedIndex];
  const isGif = selectedTemplate.imgUrl.toLowerCase().endsWith(".gif");

  const filteredTemplates = useMemo(() => {
    return getFilteredTemplates(query);
  }, [query]);

  const chooseTemplate = (index: number) => {
    setSelectedIndex(index);
    setTexts(getInitialTexts(templates[index]));
  };

  const updateQuery = (nextQuery: string) => {
    setQuery(nextQuery);

    const nextFilteredTemplates = getFilteredTemplates(nextQuery);
    if (
      nextFilteredTemplates.length > 0 &&
      !nextFilteredTemplates.some(({ index }) => index === selectedIndex)
    ) {
      chooseTemplate(nextFilteredTemplates[0].index);
    }
  };

  const randomizeTemplate = () => {
    const nextIndex = Math.floor(Math.random() * templates.length);
    chooseTemplate(nextIndex);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <aside className="space-y-4">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-xl">Meme Demo</CardTitle>
                <Badge variant={isGif ? "default" : "secondary"}>
                  {isGif ? "GIF" : "Still"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Click the rendered meme to download a GIF.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-search">Template</Label>
                <Input
                  id="template-search"
                  value={query}
                  onChange={(event) => updateQuery(event.target.value)}
                  placeholder="Search templates"
                />
                <select
                  value={selectedIndex}
                  onChange={(event) => chooseTemplate(Number(event.target.value))}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  aria-label="Meme template"
                >
                  {filteredTemplates.length === 0 && (
                    <option value={selectedIndex} disabled>
                      No templates found
                    </option>
                  )}
                  {filteredTemplates.map(({ template, index }) => {
                    const suffix = template.imgUrl.endsWith(".gif") ? " GIF" : "";
                    return (
                      <option key={template.imgUrl} value={index}>
                        {template.name}{suffix}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={randomizeTemplate}>
                  <Shuffle className="size-4" />
                  Random
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTexts(getInitialTexts(selectedTemplate))}
                >
                  <Wand2 className="size-4" />
                  Example
                </Button>
              </div>

              <div className="space-y-3">
                {selectedTemplate.text.map((_, index) => (
                  <div key={`${selectedTemplate.imgUrl}-${index}`} className="space-y-2">
                    <Label htmlFor={`text-${index}`}>Text {index + 1}</Label>
                    <Input
                      id={`text-${index}`}
                      value={texts[index] ?? ""}
                      placeholder={`Text ${index + 1}`}
                      onChange={(event) => {
                        const nextTexts = [...texts];
                        nextTexts[index] = event.target.value;
                        setTexts(nextTexts);
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="flex min-h-[70vh] items-center justify-center rounded-lg border border-border/70 bg-card/40 p-4 sm:p-6">
          <MemeCanvas
            template={selectedTemplate}
            texts={texts}
            showPlaceholder
          />
        </section>
      </div>
    </main>
  );
}
