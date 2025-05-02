import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> // Use React.TextareaHTMLAttributes
>(({className, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm transition-colors duration-200 focus:border-primary/60 dark:bg-secondary/20', // Matched Input styling (subtle background, refined shadow, focus border)
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
