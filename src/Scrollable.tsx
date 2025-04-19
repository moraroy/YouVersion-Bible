import React, { FC, ForwardRefExoticComponent, useRef } from "react";
import {
  Focusable,
  FocusableProps,
  GamepadEvent,
  GamepadButton,
} from "decky-frontend-lib";

const DEFAULTSCROLLSPEED = 50;

export interface ScrollableElement extends HTMLDivElement {}

export function scrollableRef() {
  return useRef<ScrollableElement>(null);
}

export const Scrollable: ForwardRefExoticComponent<any> = React.forwardRef((props, ref) => {
  props.style = {
    height: "95vh",
    overflowY: "scroll",
    ...props.style,
  };
  return <div ref={ref} {...props} />;
});

interface ScrollAreaProps extends FocusableProps {
  scrollable: React.RefObject<ScrollableElement>;
  scrollSpeed?: number;
}

const scrollOnDirection = (
  e: GamepadEvent,
  ref: React.RefObject<ScrollableElement>,
  amt: number,
  prev: React.RefObject<HTMLDivElement>,
  next: React.RefObject<HTMLDivElement>
) => {
  let childNodes = ref.current?.childNodes;
  let currentIndex = null;
  childNodes?.forEach((node, i) => {
    if (node === e.currentTarget) currentIndex = i;
  });

  let pos = (e.currentTarget as HTMLElement)?.getBoundingClientRect();

  let out = ref.current?.getBoundingClientRect();

  if (e.detail.button === GamepadButton.DIR_DOWN) {
    if (
      out?.bottom !== undefined &&
      pos.bottom <= out.bottom &&
      currentIndex !== null &&
      currentIndex + 1 < (childNodes?.length || 0)

    ) {
      next.current?.focus();
    } else {
      ref.current?.scrollBy({ top: amt, behavior: "smooth" });
    }
  } else if (e.detail.button === GamepadButton.DIR_UP) {
    if (
      out?.top !== undefined &&
      pos.top >= out.top &&
      currentIndex !== null &&
      currentIndex - 1 >= 0
    ) {
      prev.current?.focus();
    } else {
      ref.current?.scrollBy({ top: -amt, behavior: "smooth" });
    }
  }
};

export const ScrollArea: FC<ScrollAreaProps> = (props) => {
  const scrollSpeed = props.scrollSpeed ?? DEFAULTSCROLLSPEED;
  const prevFocus = useRef<HTMLDivElement>(null);
  const nextFocus = useRef<HTMLDivElement>(null);

  
  props.onActivate = (e) => (e.currentTarget as HTMLElement)?.focus();

  props.onGamepadDirection = (e) =>
    scrollOnDirection(e, props.scrollable, scrollSpeed, prevFocus, nextFocus);

  return (
    <>
      <Focusable ref={prevFocus} children={[]} onActivate={() => {}} />
      <Focusable {...props} />
      <Focusable ref={nextFocus} children={[]} onActivate={() => {}} />
    </>
  );
};
