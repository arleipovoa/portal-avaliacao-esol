import React from 'react';

type IconifyProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement> & {
    icon?: string;
    width?: number | string;
    height?: number | string;
    inline?: boolean;
    flip?: string;
    rotate?: number | string;
  },
  HTMLElement
>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': IconifyProps;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': IconifyProps;
    }
  }
}
