import React from 'react';

export interface EditableTextProps {
  html: string;
  onChange: (html: string) => void;
  editable: boolean;
  tagName: string;
  className?: string;
  style?: React.CSSProperties;
  onBlur?: () => void;
  onClick?: (e: React.MouseEvent) => void;
  innerRef?: React.Ref<any>;
}

export class EditableText extends React.Component<EditableTextProps> {
  elementRef = React.createRef<HTMLElement>();

  setRef = (element: HTMLElement | null) => {
    // @ts-ignore
    this.elementRef.current = element;
    if (this.props.innerRef) {
      if (typeof this.props.innerRef === 'function') {
        this.props.innerRef(element);
      } else {
        // @ts-ignore
        this.props.innerRef.current = element;
      }
    }
  };

  shouldComponentUpdate(nextProps: EditableTextProps) {
    const el = this.elementRef.current;
    if (!el) return true;

    if (this.props.editable !== nextProps.editable) return true;
    if (this.props.tagName !== nextProps.tagName) return true;
    if (this.props.className !== nextProps.className) return true;
    
    // Quick shallow comparison of styles
    const prevStyle = this.props.style || {};
    const nextStyle = nextProps.style || {};
    const keys1 = Object.keys(prevStyle);
    const keys2 = Object.keys(nextStyle);
    if (keys1.length !== keys2.length) return true;
    for (const key of keys1) {
      // @ts-ignore
      if (prevStyle[key] !== nextStyle[key]) return true;
    }

    // Crucial check: Only re-render if incoming HTML is different from current DOM contents
    // (This avoids resetting cursor when typing, since nextProps.html will match el.innerHTML)
    if (nextProps.html !== el.innerHTML) {
      return true;
    }

    return false;
  }

  componentDidUpdate() {
    const el = this.elementRef.current;
    if (el && this.props.html !== el.innerHTML) {
      el.innerHTML = this.props.html;
    }
  }

  componentDidMount() {
    const el = this.elementRef.current;
    if (el) {
      el.innerHTML = this.props.html;
    }
  }

  handleInput = (e: React.FormEvent<HTMLElement>) => {
    const html = e.currentTarget.innerHTML;
    this.props.onChange(html);
  };

  render() {
    const { tagName, className, style, editable, onBlur, onClick } = this.props;
    const Tag = tagName as any;
    return (
      <Tag
        ref={this.setRef}
        contentEditable={editable}
        onInput={this.handleInput}
        onBlur={onBlur}
        onClick={onClick}
        className={className}
        style={style}
        suppressContentEditableWarning
      />
    );
  }
}
