import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { theme } from "../constants/theme";

export function usePressScale(scaleTarget = 0.95) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(scaleTarget, theme.spring.snappy);
  };

  const onPressOut = () => {
    scale.value = withSpring(1, theme.spring.bouncy);
  };

  return { animatedStyle, onPressIn, onPressOut };
}
