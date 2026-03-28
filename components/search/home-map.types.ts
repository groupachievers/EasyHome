import type { StyleProp, ViewStyle } from 'react-native';

import type { HomeListing } from '@/types/home';

export type HomeMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type HomeMapHandle = {
  animateToRegion: (region: HomeMapRegion, duration?: number) => void;
};

export type HomeMapProps = {
  defaultMarkerColor: string;
  homes: HomeListing[];
  initialRegion: HomeMapRegion;
  markerShadowColor: string;
  onRegionChangeComplete: (region: HomeMapRegion) => void;
  onSelectHome: (home: HomeListing) => void;
  selectedHomeId: string | null;
  selectedMarkerColor: string;
  style: StyleProp<ViewStyle>;
};
