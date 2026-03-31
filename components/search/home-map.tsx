import { forwardRef, useImperativeHandle, useRef } from 'react';
import MapView, { Marker } from 'react-native-maps';
import type { Region } from 'react-native-maps';

import type { HomeMapHandle, HomeMapProps, HomeMapRegion } from '@/components/search/home-map.types';

const HomeMap = forwardRef<HomeMapHandle, HomeMapProps>(function HomeMap(
  {
    defaultMarkerColor,
    homes,
    initialRegion,
    markerShadowColor: _markerShadowColor,
    onRegionChangeComplete,
    onSelectHome,
    selectedHomeId,
    selectedMarkerColor,
    style,
  },
  ref
) {
  const mapRef = useRef<MapView>(null);

  useImperativeHandle(
    ref,
    () => ({
      animateToRegion: (region, duration = 500) => {
        mapRef.current?.animateToRegion(region as Region, duration);
      },
    }),
    []
  );

  return (
    <MapView
      ref={mapRef}
      style={style}
      initialRegion={initialRegion as Region}
      onRegionChangeComplete={(region) => onRegionChangeComplete(region as HomeMapRegion)}
      showsCompass
      showsBuildings
      toolbarEnabled={false}>
      {homes.map((home) => {
        const markerColor = selectedHomeId === home.id ? selectedMarkerColor : defaultMarkerColor;

        return (
          <Marker
            key={home.id}
            coordinate={home.coordinate}
            title={home.title}
            description={`${home.price} | ${home.rentalType} | ${home.area}`}
            onPress={() => onSelectHome(home)}
            pinColor={markerColor}
            tracksViewChanges={false}
          />
        );
      })}
    </MapView>
  );
});

export default HomeMap;
