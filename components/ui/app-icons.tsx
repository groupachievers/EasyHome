import Svg, { Path } from 'react-native-svg';

type AppIconProps = {
  size?: number;
  fill?: string;
};

export function SearchIcon({ size = 24, fill = '#9CA3AF' }: AppIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22.552 20.372L18.221 16.08C19.178 14.608 19.689 12.691 19.732 10.346C19.628 4.406 16.303 1.113 10.358 1.074C4.342 1.111 0.996 4.516 0.996 10.345C0.996 16.09 4.345 19.618 10.37 19.653C12.704 19.639 14.619 19.148 16.096 18.197L20.441 22.503C20.997 23.027 21.901 23.112 22.562 22.493C23.167 21.927 23.141 20.955 22.552 20.372Z"
        fill={fill}
      />
    </Svg>
  );
}

export function StarIcon({ size = 24, fill = '#9CA3AF' }: AppIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1.327 12.4L4.887 15L3.535 19.187A3.178 3.178 0 0 0 4.719 22.8A3.177 3.177 0 0 0 8.519 22.781L12 20.219L15.482 22.778A3.227 3.227 0 0 0 20.465 19.187L19.113 15L22.673 12.4A3.227 3.227 0 0 0 20.773 6.568H16.4L15.073 2.432A3.227 3.227 0 0 0 8.927 2.432L7.6 6.568H3.231A3.227 3.227 0 0 0 1.327 12.4Z"
        fill={fill}
      />
    </Svg>
  );
}

export function MenuBurgerIcon({ size = 24, fill = '#9CA3AF' }: AppIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <Path
        d="M480 224H32C14.327 224 0 238.327 0 256S14.327 288 32 288H480C497.673 288 512 273.673 512 256S497.673 224 480 224Z"
        fill={fill}
      />
      <Path
        d="M32 138.667H448C465.673 138.667 480 124.34 480 106.667S465.673 74.667 448 74.667H32C14.327 74.667 0 88.994 0 106.667S14.327 138.667 32 138.667Z"
        fill={fill}
      />
      <Path
        d="M480 373.333H32C14.327 373.333 0 387.66 0 405.333S14.327 437.333 32 437.333H480C497.673 437.333 512 423.006 512 405.333S497.673 373.333 480 373.333Z"
        fill={fill}
      />
    </Svg>
  );
}

export function MapPinIcon({ size = 28, fill = '#111827' }: AppIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6C18 2.691 15.309 0 12 0C8.691 0 6 2.691 6 6C6 8.968 8.166 11.439 11 11.916V23C11 23.552 11.448 24 12 24C12.552 24 13 23.552 13 23V11.916C15.834 11.439 18 8.968 18 6Z"
        fill={fill}
      />
    </Svg>
  );
}

