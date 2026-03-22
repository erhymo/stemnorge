type RichTextBlockProps = {
  text: string;
  className?: string;
};

export default function RichTextBlock({ text, className }: RichTextBlockProps) {
  const paragraphs = text
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className={className}>
      {(paragraphs.length > 0 ? paragraphs : [text]).map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 24)}`} className="whitespace-pre-wrap">
          {paragraph}
        </p>
      ))}
    </div>
  );
}