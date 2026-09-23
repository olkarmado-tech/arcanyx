import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  type KeyboardEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  type View,
} from "react-native";

function overlapFromEvent(event: KeyboardEvent) {
  const frame = event.endCoordinates;
  if (frame.screenY > 0) {
    // Android reports screenY in absolute screen coordinates, while the
    // "window" height can exclude the status bar. Measure against the screen
    // there so the overlap is not short by the status bar height.
    const bottom =
      Platform.OS === "android"
        ? Dimensions.get("screen").height
        : Dimensions.get("window").height;
    return Math.max(0, bottom - frame.screenY);
  }
  return Math.max(0, frame.height);
}

/**
 * How many pixels the keyboard covers, measured from the bottom of the screen
 * (so it includes the navigation bar area on Android). Zero when the window
 * already resized.
 */
export function useKeyboardOverlap(enabled = true) {
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setOverlap(0);
      return;
    }
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (event) => {
      setOverlap(overlapFromEvent(event));
    });
    const hide = Keyboard.addListener(hideEvent, () => setOverlap(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [enabled]);

  return overlap;
}

type ScrollAboveOptions = {
  scrollRef: RefObject<ScrollView | null>;
  getTarget: () => View | null;
  /** Extra space to keep above the keyboard, for a bar sitting over the scroll. */
  gap?: number;
};

/** Pads a scroll view and moves the focused field above the keyboard. */
export function useScrollAboveKeyboard({
  scrollRef,
  getTarget,
  gap = 16,
}: ScrollAboveOptions) {
  const overlap = useKeyboardOverlap();
  const scrollY = useRef(0);
  const focused = useRef(false);
  const getTargetRef = useRef(getTarget);
  getTargetRef.current = getTarget;

  const reveal = useCallback(
    (lift: number) => {
      if (!focused.current) return;
      getTargetRef.current()?.measureInWindow((_x, y, _width, height) => {
        const visibleBottom = Dimensions.get("window").height - lift - gap;
        const hidden = y + height - visibleBottom;
        if (hidden > 8) {
          scrollRef.current?.scrollTo({
            y: scrollY.current + hidden,
            animated: true,
          });
        }
      });
    },
    [gap, scrollRef],
  );

  useEffect(() => {
    if (overlap <= 0 || !focused.current) return;
    const first = setTimeout(() => reveal(overlap), 60);
    const second = setTimeout(() => reveal(overlap), 280);
    return () => {
      clearTimeout(first);
      clearTimeout(second);
    };
  }, [overlap, reveal]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
  }, []);

  const onFocus = useCallback(() => {
    focused.current = true;
    if (overlap > 0) setTimeout(() => reveal(overlap), 60);
  }, [overlap, reveal]);

  const onBlur = useCallback(() => {
    focused.current = false;
  }, []);

  return { overlap, onScroll, onFocus, onBlur };
}
