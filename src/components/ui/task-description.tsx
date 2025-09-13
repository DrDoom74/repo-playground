import React from 'react';

interface TaskDescriptionProps {
  description: string;
}

export function TaskDescription({ description }: TaskDescriptionProps) {
  const parseMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.trim().split('\n');
    const elements: React.ReactNode[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (!line.trim()) {
        continue; // Skip empty lines
      }

      // Headers (## Text)
      if (line.startsWith('## ')) {
        const headerText = line.substring(3);
        elements.push(
          <h3 key={key++} className="text-lg font-semibold mb-2 mt-4 first:mt-0">
            {parseInlineMarkdown(headerText)}
          </h3>
        );
        continue;
      }

      // List items starting with -
      if (line.trim().startsWith('- ')) {
        const listItems: React.ReactNode[] = [];
        let j = i;
        
        while (j < lines.length && lines[j].trim().startsWith('- ')) {
          const itemText = lines[j].trim().substring(2);
          listItems.push(
            <li key={j} className="mb-1">
              {parseInlineMarkdown(itemText)}
            </li>
          );
          j++;
        }
        
        elements.push(
          <ul key={key++} className="list-disc list-inside mb-3 space-y-1">
            {listItems}
          </ul>
        );
        
        i = j - 1; // Skip processed lines
        continue;
      }

      // Regular paragraphs
      elements.push(
        <p key={key++} className="mb-3 leading-relaxed">
          {parseInlineMarkdown(line)}
        </p>
      );
    }

    return elements;
  };

  const parseInlineMarkdown = (text: string): React.ReactNode => {
    // Handle **bold** text
    let result: React.ReactNode = text;
    
    // Replace **text** with <strong>
    result = text.split(/(\*\*[^*]+\*\*)/).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      
      // Handle `code` blocks
      if (part.includes('`')) {
        return part.split(/(`[^`]+`)/).map((codePart, codeIndex) => {
          if (codePart.startsWith('`') && codePart.endsWith('`')) {
            return (
              <code key={`${index}-${codeIndex}`} className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
                {codePart.slice(1, -1)}
              </code>
            );
          }
          return codePart;
        });
      }
      
      return part;
    });

    return result;
  };

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert text-sm">
      {parseMarkdown(description)}
    </div>
  );
}