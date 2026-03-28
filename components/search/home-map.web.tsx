import { forwardRef, useImperativeHandle } from 'react';

import type { HomeMapHandle, HomeMapProps } from '@/components/search/home-map.types';

const HomeMap = forwardRef<HomeMapHandle, HomeMapProps>(function HomeMap(_props, ref) {
  useImperativeHandle(
    ref,
    () => ({
      animateToRegion: () => {},
    }),
    []
  );

  return null;
});

export default HomeMap;
