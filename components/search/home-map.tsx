import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { Region } from 'react-native-maps';

import { MapPinIcon } from '@/components/ui/app-icons';
import type { HomeMapHandle, HomeMapProps, HomeMapRegion } from '@/components/search/home-map.types';

const HomeMap = forwardRef<HomeMapHandle, HomeMapProps>(function HomeMap(
  {
    defaultMarkerColor,
    homes,
    initialRegion,
    markerShadowColor,
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
            onPress={() => onSelectHome(home)}>
            <View style={[styles.markerWrap, { shadowColor: markerShadowColor }]}>
              <MapPinIcon size={34} fill={markerColor} />
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
});

const styles = StyleSheet.create({
  markerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
});

export default HomeMap;
