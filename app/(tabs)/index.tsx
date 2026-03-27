import { Image } from 'expo-image';
import { Href, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputSubmitEditingEventData,
  View,
  NativeSyntheticEvent,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MapPinIcon, SearchIcon, StarIcon } from '@/components/ui/app-icons';
import { useAppPreferences } from '@/context/app-preferences';
import { useAuth } from '@/src/hooks/useAuth';
import { HOME_LISTINGS } from '@/constants/homes';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { HomeListing } from '@/types/home';

const NIGERIA_REGION: Region = {
  latitude: 9.082,
  longitude: 8.6753,
  latitudeDelta: 10.8,
  longitudeDelta: 10.8,
};

const FILTER_CHIPS = ['Any budget', '2+ beds', 'Furnished', 'Move now'];
const HOME_IMAGE_SOURCES = [
  require('@/assets/images/homes/minh-pham-OtXADkUh3-I-unsplash.jpg'),
  require('@/assets/images/homes/sarah-dorweiler-0QmzQZndkOQ-unsplash.jpg'),
  require('@/assets/images/homes/spacejoy-hWwP4LTGEQA-unsplash.jpg'),
  require('@/assets/images/homes/spacejoy-RqO6kwm4tZY-unsplash.jpg'),
] as const;
const TAB_BAR_CLEARANCE = 0;
const GALLERY_TONES = ['#CFE8E4', '#ECDDCF', '#DDE7F5'];
const SEARCH_REGION_DELTA = 0.45;

const POPULAR_DESTINATIONS: {
  id: string;
  keywords: string[];
  region: Region;
}[] = [
  {
    id: 'lagos',
    keywords: ['lagos', 'ikoyi', 'yaba'],
    region: {
      latitude: 6.5244,
      longitude: 3.3792,
      latitudeDelta: 0.38,
      longitudeDelta: 0.38,
    },
  },
  {
    id: 'abuja',
    keywords: ['abuja', 'maitama', 'wuse'],
    region: {
      latitude: 9.0765,
      longitude: 7.3986,
      latitudeDelta: 0.34,
      longitudeDelta: 0.34,
    },
  },
  {
    id: 'port-harcourt',
    keywords: ['port harcourt', 'gra', 'bayside'],
    region: {
      latitude: 4.8156,
      longitude: 7.0336,
      latitudeDelta: 0.24,
      longitudeDelta: 0.24,
    },
  },
  {
    id: 'ibadan',
    keywords: ['ibadan', 'bodija'],
    region: {
      latitude: 7.4056,
      longitude: 3.9284,
      latitudeDelta: 0.24,
      longitudeDelta: 0.24,
    },
  },
  {
    id: 'kano',
    keywords: ['kano', 'nassarawa'],
    region: {
      latitude: 12.0022,
      longitude: 8.592,
      latitudeDelta: 0.3,
      longitudeDelta: 0.3,
    },
  },
  {
    id: 'enugu',
    keywords: ['enugu', 'independence'],
    region: {
      latitude: 6.4497,
      longitude: 7.5102,
      latitudeDelta: 0.22,
      longitudeDelta: 0.22,
    },
  },
  {
    id: 'ede',
    keywords: ['ede', 'osun', 'redeemer'],
    region: {
      latitude: 7.733,
      longitude: 4.437,
      latitudeDelta: 0.18,
      longitudeDelta: 0.18,
    },
  },
  {
    id: 'uyo',
    keywords: ['uyo', 'shelter afrique'],
    region: {
      latitude: 5.0383,
      longitude: 7.9292,
      latitudeDelta: 0.2,
      longitudeDelta: 0.2,
    },
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isHomeInRegion(home: HomeListing, region: Region) {
  const latitudeMin = region.latitude - region.latitudeDelta / 2;
  const latitudeMax = region.latitude + region.latitudeDelta / 2;
  const longitudeMin = region.longitude - region.longitudeDelta / 2;
  const longitudeMax = region.longitude + region.longitudeDelta / 2;

  return (
    home.coordinate.latitude >= latitudeMin &&
    home.coordinate.latitude <= latitudeMax &&
    home.coordinate.longitude >= longitudeMin &&
    home.coordinate.longitude <= longitudeMax
  );
}

function matchesQuery(home: HomeListing, query: string) {
  if (!query.trim()) {
    return true;
  }

  const normalizedQuery = query.trim().toLowerCase();

  return [
    home.title,
    home.area,
    home.price,
    home.availability,
    home.rentalType,
    home.landlord.name,
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
}

function getRegionLabel(region: Region) {
  if (region.latitudeDelta > 6) {
    return 'Nigeria';
  }

  return 'this area';
}

function getHomeImageSource(homeId: string, galleryIndex = 0) {
  const baseIndex =
    homeId.split('').reduce((total, character) => total + character.charCodeAt(0), 0) %
    HOME_IMAGE_SOURCES.length;

  return HOME_IMAGE_SOURCES[(baseIndex + galleryIndex) % HOME_IMAGE_SOURCES.length];
}

function getQueryDestination(query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return null;
  }

  const keywordDestination = POPULAR_DESTINATIONS.find((destination) =>
    destination.keywords.some((keyword) => normalizedQuery.includes(keyword))
  );

  if (keywordDestination) {
    return keywordDestination.region;
  }

  const relatedHome = HOME_LISTINGS.find((home) => matchesQuery(home, normalizedQuery));

  if (!relatedHome) {
    return null;
  }

  return {
    latitude: relatedHome.coordinate.latitude,
    longitude: relatedHome.coordinate.longitude,
    latitudeDelta: SEARCH_REGION_DELTA,
    longitudeDelta: SEARCH_REGION_DELTA,
  };
}

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const styles = createStyles(palette);
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useAppPreferences();
  const { profile } = useAuth();
  const mapRef = useRef<MapView>(null);

  const listSheetHeight = useRef(new Animated.Value(0)).current;
  const detailSheetHeight = useRef(new Animated.Value(0)).current;

  const currentListSheetHeight = useRef(0);
  const currentDetailSheetHeight = useRef(0);

  const listSnapHeights = useRef({ min: 0, mid: 0, max: 0 });
  const detailSnapHeights = useRef({ dismiss: 0, hidden: 0, mid: 0, max: 0 });

  const listDragStartHeight = useRef(0);
  const detailDragStartHeight = useRef(0);
  const initializedListSheet = useRef(false);

  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<Region>(NIGERIA_REGION);
  const [selectedHomeId, setSelectedHomeId] = useState<string | null>(null);
  const lastSearchTargetRef = useRef<string | null>(null);

  const selectedHome = useMemo(
    () => HOME_LISTINGS.find((home) => home.id === selectedHomeId) ?? null,
    [selectedHomeId]
  );
  const avatarInitials =
    profile?.name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'EH';

  useEffect(() => {
    const listListenerId = listSheetHeight.addListener(({ value }) => {
      currentListSheetHeight.current = value;
    });
    const detailListenerId = detailSheetHeight.addListener(({ value }) => {
      currentDetailSheetHeight.current = value;
    });

    return () => {
      listSheetHeight.removeListener(listListenerId);
      detailSheetHeight.removeListener(detailListenerId);
    };
  }, [detailSheetHeight, listSheetHeight]);

  const homesInView = useMemo(
    () => HOME_LISTINGS.filter((home) => isHomeInRegion(home, region)),
    [region]
  );

  const visibleHomes = useMemo(
    () => homesInView.filter((home) => matchesQuery(home, query)),
    [homesInView, query]
  );

  const triggerSearch = (nextQuery: string) => {
    const destination = getQueryDestination(nextQuery);
    const searchKey = destination
      ? `${destination.latitude}-${destination.longitude}-${destination.latitudeDelta}`
      : null;

    if (!destination || lastSearchTargetRef.current === searchKey) {
      return;
    }

    lastSearchTargetRef.current = searchKey;
    mapRef.current?.animateToRegion(destination, 450);
  };

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      lastSearchTargetRef.current = null;
      return;
    }

    const timeoutId = setTimeout(() => {
      triggerSearch(trimmedQuery);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const animateListSheetTo = (nextHeight: number) => {
    Animated.spring(listSheetHeight, {
      toValue: nextHeight,
      useNativeDriver: false,
      friction: 12,
      tension: 90,
    }).start();
  };

  const animateDetailSheetTo = (nextHeight: number, onComplete?: () => void) => {
    Animated.spring(detailSheetHeight, {
      toValue: nextHeight,
      useNativeDriver: false,
      friction: 12,
      tension: 90,
    }).start(({ finished }) => {
      if (finished) {
        onComplete?.();
      }
    });
  };

  const closeDetailSheet = () => {
    animateDetailSheetTo(detailSnapHeights.current.hidden, () => {
      setSelectedHomeId(null);
    });
  };

  const openHomeDetails = (home: HomeListing) => {
    setSelectedHomeId(home.id);
    mapRef.current?.animateToRegion(
      {
        latitude: home.coordinate.latitude,
        longitude: home.coordinate.longitude,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      },
      300
    );

    if (detailSnapHeights.current.mid > 0) {
      animateDetailSheetTo(detailSnapHeights.current.mid);
    }
  };

  const listPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,
      onPanResponderGrant: () => {
        listDragStartHeight.current = currentListSheetHeight.current;
      },
      onPanResponderMove: (_, gestureState) => {
        const nextHeight = clamp(
          listDragStartHeight.current - gestureState.dy,
          listSnapHeights.current.min,
          listSnapHeights.current.max
        );

        listSheetHeight.setValue(nextHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const releaseHeight = clamp(
          listDragStartHeight.current - gestureState.dy,
          listSnapHeights.current.min,
          listSnapHeights.current.max
        );

        const nextSnap = [listSnapHeights.current.min, listSnapHeights.current.mid, listSnapHeights.current.max].reduce(
          (closest, point) =>
            Math.abs(point - releaseHeight) < Math.abs(closest - releaseHeight) ? point : closest,
          listSnapHeights.current.mid
        );

        animateListSheetTo(nextSnap);
      },
    })
  ).current;

  const detailPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,
      onPanResponderGrant: () => {
        detailDragStartHeight.current = currentDetailSheetHeight.current;
      },
      onPanResponderMove: (_, gestureState) => {
        const nextHeight = clamp(
          detailDragStartHeight.current - gestureState.dy,
          detailSnapHeights.current.hidden,
          detailSnapHeights.current.max
        );

        detailSheetHeight.setValue(nextHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const releaseHeight = clamp(
          detailDragStartHeight.current - gestureState.dy,
          detailSnapHeights.current.hidden,
          detailSnapHeights.current.max
        );

        if (releaseHeight < detailSnapHeights.current.dismiss) {
          closeDetailSheet();
          return;
        }

        const nextSnap = [detailSnapHeights.current.mid, detailSnapHeights.current.max].reduce(
          (closest, point) =>
            Math.abs(point - releaseHeight) < Math.abs(closest - releaseHeight) ? point : closest,
          detailSnapHeights.current.mid
        );

        animateDetailSheetTo(nextSnap);
      },
    })
  ).current;

  const handleSearchSubmit = (
    event?: NativeSyntheticEvent<TextInputSubmitEditingEventData>
  ) => {
    triggerSearch(event?.nativeEvent.text ?? query);
  };

  const onContainerLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    const availableHeight = nativeEvent.layout.height - TAB_BAR_CLEARANCE;

    if (availableHeight <= 0) {
      return;
    }

    listSnapHeights.current = {
      min: Math.max(availableHeight * 0.1, 96),
      mid: availableHeight * 0.5,
      max: availableHeight * 0.7,
    };

    detailSnapHeights.current = {
      dismiss: availableHeight * 0.3,
      hidden: 0,
      mid: availableHeight * 0.7,
      max: availableHeight * 0.7,
    };

    if (!initializedListSheet.current) {
      initializedListSheet.current = true;
      listSheetHeight.setValue(listSnapHeights.current.mid);
      currentListSheetHeight.current = listSnapHeights.current.mid;
    } else {
      const nextListHeight = clamp(
        currentListSheetHeight.current,
        listSnapHeights.current.min,
        listSnapHeights.current.max
      );
      listSheetHeight.setValue(nextListHeight);
    }

    const nextDetailHeight = selectedHome
      ? clamp(
          currentDetailSheetHeight.current || detailSnapHeights.current.mid,
          detailSnapHeights.current.hidden,
          detailSnapHeights.current.max
        )
      : detailSnapHeights.current.hidden;

    detailSheetHeight.setValue(nextDetailHeight);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container} onLayout={onContainerLayout}>
        {Platform.OS === 'web' ? (
          <View style={styles.webFallback}>
            <Text style={styles.webFallbackTitle}>Map preview is available on Android and iOS.</Text>
            <Text style={styles.webFallbackText}>
              The draggable sheet still reflects the homes available in the current search result.
            </Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={NIGERIA_REGION}
            onRegionChangeComplete={setRegion}
            showsCompass
            showsBuildings
            toolbarEnabled={false}>
            {visibleHomes.map((home) => {
              const markerColor = selectedHomeId === home.id ? palette.tabIconSelected : palette.accent;

              return (
                <Marker
                  key={home.id}
                  coordinate={home.coordinate}
                  title={home.title}
                  description={`${home.price} | ${home.rentalType} | ${home.area}`}
                  onPress={() => openHomeDetails(home)}>
                  <View style={styles.markerWrap}>
                    <MapPinIcon size={34} fill={markerColor} />
                  </View>
                </Marker>
              );
            })}
          </MapView>
        )}

        <View style={styles.topOverlay} pointerEvents="box-none">
          <View style={styles.searchBar}>
            <SearchIcon size={18} fill={palette.accent} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearchSubmit}
              placeholder="Search here"
              placeholderTextColor={palette.muted}
              returnKeyType="search"
              selectionColor={palette.accent}
              style={styles.searchInput}
            />
            <View style={styles.avatarCircle}>
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarText}>{avatarInitials}</Text>
              )}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}>
            {FILTER_CHIPS.map((chip) => (
              <View key={chip} style={styles.filterChip}>
                <Text style={styles.filterChipText}>{chip}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <Animated.View style={[styles.sheet, { height: listSheetHeight }]}>
          <View style={styles.sheetHandleArea} {...listPanResponder.panHandlers}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetCaption}>Drag to expand or collapse</Text>
          </View>

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Homes in view</Text>
              <Text style={styles.sheetSubtitle}>
                {visibleHomes.length} available in {getRegionLabel(region)}
              </Text>
            </View>
            <View style={styles.sheetPill}>
              <Text style={styles.sheetPillText}>{query.trim() ? 'Filtered' : 'Live map'}</Text>
            </View>
          </View>

          {visibleHomes.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No houses available</Text>
              <Text style={styles.emptyStateText}>
                Move the map or zoom out to load more rental homes.
              </Text>
            </View>
          ) : (
            <FlatList
              data={visibleHomes}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const favorite = isFavorite(item.id);
                const selected = item.id === selectedHomeId;

                return (
                  <Pressable
                    onPress={() => openHomeDetails(item)}
                    style={[styles.homeCard, selected && styles.homeCardSelected]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderText}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardArea}>{item.area}</Text>
                      </View>
                      <Pressable
                        onPress={() => toggleFavorite(item.id)}
                        hitSlop={10}
                        style={styles.favoriteButton}>
                        <StarIcon size={18} fill={favorite ? palette.tabIconSelected : palette.icon} />
                      </Pressable>
                    </View>

                    <View style={styles.priceRow}>
                      <Text style={styles.priceText}>{item.price}</Text>
                      <Text style={styles.metaText}>
                        {item.rentalType} | {item.size} sqm
                      </Text>
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.distanceText}>{item.distance} from the center</Text>
                      <View style={styles.availabilityBadge}>
                        <Text style={styles.availabilityText}>{item.availability}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </Animated.View>

        <Animated.View
          pointerEvents={selectedHome ? 'auto' : 'none'}
          style={[styles.detailSheet, { height: detailSheetHeight }]}>
          {selectedHome ? (
            <>
              <View style={styles.detailHandleArea} {...detailPanResponder.panHandlers}>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetCaption}>Drag up for full details, drag down to close</Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.detailContent}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryContent}>
                  {selectedHome.gallery.map((label, index) => (
                    <View
                      key={`${selectedHome.id}-${label}`}
                      style={[
                        styles.galleryCard,
                        { backgroundColor: GALLERY_TONES[index % GALLERY_TONES.length] },
                      ]}>
                      <Image
                        source={getHomeImageSource(selectedHome.id, index)}
                        style={styles.galleryImage}
                        contentFit="cover"
                      />
                      <View style={styles.galleryOverlay} />
                      <Text style={styles.galleryLabel}>{label}</Text>
                      <Text style={styles.galleryCaption}>{selectedHome.area}</Text>
                    </View>
                  ))}
                </ScrollView>

                <Text style={styles.detailTitle}>{selectedHome.title}</Text>
                <View
                  style={[
                    styles.detailAvailabilityPill,
                    selectedHome.isAvailable ? styles.detailAvailabilityGood : styles.detailAvailabilityBad,
                  ]}>
                  <Text style={styles.detailAvailabilityText}>
                    {selectedHome.isAvailable ? 'Available' : 'Not Available'}
                  </Text>
                </View>

                <View style={styles.factGrid}>
                  <View style={styles.factCard}>
                    <Text style={styles.factLabel}>Flat type</Text>
                    <Text style={styles.factValue}>{selectedHome.rentalType}</Text>
                  </View>
                  <View style={styles.factCard}>
                    <Text style={styles.factLabel}>Rental price</Text>
                    <Text style={styles.factValue}>{selectedHome.price}</Text>
                  </View>
                  <View style={styles.factCard}>
                    <Text style={styles.factLabel}>Solar</Text>
                    <Text style={styles.factValue}>{selectedHome.hasSolar ? 'Solar installed' : 'No solar yet'}</Text>
                  </View>
                  <View style={styles.factCard}>
                    <Text style={styles.factLabel}>Prediction</Text>
                    <Text style={styles.factValue}>{selectedHome.growthPrediction}</Text>
                  </View>
                </View>

                <View style={styles.landlordCard}>
                  <View style={[styles.landlordAvatar, styles.landlordAvatarFallback]}>
                    <Text style={styles.landlordAvatarText}>{selectedHome.landlord.avatarLabel}</Text>
                  </View>
                  <View style={styles.landlordInfo}>
                    <Text style={styles.landlordLabel}>Landlord / Landlady</Text>
                    <Text style={styles.landlordName}>{selectedHome.landlord.name}</Text>
                    <Text style={styles.landlordPhone}>{selectedHome.landlord.phone}</Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => router.push(`/payment/${selectedHome.id}` as Href)}
                  style={[
                    styles.rentButton,
                    styles.rentButtonBase,
                    colorScheme === 'dark' ? styles.rentButtonDark : styles.rentButtonLight,
                  ]}>
                  <Text
                    style={[
                      styles.rentButtonText,
                      colorScheme === 'dark' ? styles.rentButtonTextDark : styles.rentButtonTextLight,
                    ]}>
                    Rent Now
                  </Text>
                </Pressable>
              </ScrollView>
            </>
          ) : null}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(palette: typeof Colors.light) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
    webFallback: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.background,
      paddingHorizontal: 24,
    },
    webFallbackTitle: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 22,
      textAlign: 'center',
    },
    webFallbackText: {
      color: palette.muted,
      fontSize: 14,
      lineHeight: 22,
      marginTop: 10,
      textAlign: 'center',
    },
    topOverlay: {
      elevation: 20,
      left: 16,
      position: 'absolute',
      right: 16,
      top: 10,
      zIndex: 20,
    },
    searchBar: {
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderRadius: 30,
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 10,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 6,
    },
    searchInput: {
      color: palette.text,
      flex: 1,
      fontFamily: Fonts.rounded,
      fontSize: 15,
      marginLeft: 12,
    },
    avatarCircle: {
      alignItems: 'center',
      backgroundColor: palette.background,
      borderRadius: 18,
      height: 36,
      justifyContent: 'center',
      overflow: 'hidden',
      width: 36,
    },
    avatarImage: {
      height: '100%',
      width: '100%',
    },
    avatarText: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 11,
    },
    filtersRow: {
      gap: 10,
      paddingBottom: 6,
      paddingTop: 14,
    },
    filterChip: {
      backgroundColor: palette.surface,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    filterChipText: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 13,
    },
    markerWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
    },
    sheet: {
      backgroundColor: palette.sheet,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      bottom: TAB_BAR_CLEARANCE,
      left: 0,
      overflow: 'hidden',
      position: 'absolute',
      right: 0,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.16,
      shadowRadius: 20,
      elevation: 14,
      zIndex: 10,
    },
    detailSheet: {
      backgroundColor: palette.surface,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      bottom: TAB_BAR_CLEARANCE,
      left: 0,
      overflow: 'hidden',
      position: 'absolute',
      right: 0,
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: -12 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 18,
      zIndex: 30,
    },
    sheetHandleArea: {
      alignItems: 'center',
      paddingTop: 10,
    },
    detailHandleArea: {
      alignItems: 'center',
      paddingTop: 10,
    },
    sheetHandle: {
      backgroundColor: palette.border,
      borderRadius: 999,
      height: 5,
      width: 56,
    },
    sheetCaption: {
      color: palette.muted,
      fontSize: 11,
      marginTop: 8,
    },
    sheetHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    sheetTitle: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 28,
    },
    sheetSubtitle: {
      color: palette.muted,
      fontSize: 13,
      marginTop: 4,
    },
    sheetPill: {
      backgroundColor: palette.surface,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    sheetPillText: {
      color: palette.accent,
      fontFamily: Fonts.rounded,
      fontSize: 12,
    },
    listContent: {
      paddingBottom: 26,
      paddingHorizontal: 20,
      paddingTop: 18,
    },
    homeCard: {
      backgroundColor: palette.surface,
      borderColor: 'transparent',
      borderRadius: 24,
      borderWidth: 1,
      marginBottom: 14,
      padding: 16,
    },
    homeCardSelected: {
      borderColor: palette.accent,
    },
    cardHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    cardHeaderText: {
      flex: 1,
      paddingRight: 12,
    },
    cardTitle: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 18,
    },
    cardArea: {
      color: palette.muted,
      fontSize: 13,
      marginTop: 4,
    },
    favoriteButton: {
      alignItems: 'center',
      backgroundColor: palette.background,
      borderRadius: 18,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    priceRow: {
      marginTop: 14,
    },
    priceText: {
      color: palette.accent,
      fontFamily: Fonts.rounded,
      fontSize: 16,
    },
    metaText: {
      color: palette.text,
      fontSize: 13,
      marginTop: 6,
    },
    cardFooter: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    distanceText: {
      color: palette.muted,
      flex: 1,
      fontSize: 12,
    },
    availabilityBadge: {
      backgroundColor: colorWithAlpha(palette.accent, 0.12),
      borderRadius: 999,
      marginLeft: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    availabilityText: {
      color: palette.accent,
      fontFamily: Fonts.rounded,
      fontSize: 11,
    },
    emptyState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingVertical: 40,
    },
    emptyStateTitle: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 22,
      textAlign: 'center',
    },
    emptyStateText: {
      color: palette.muted,
      fontSize: 14,
      lineHeight: 22,
      marginTop: 8,
      textAlign: 'center',
    },
    detailContent: {
      paddingBottom: 40,
      paddingHorizontal: 20,
      paddingTop: 14,
    },
    galleryContent: {
      paddingBottom: 8,
      paddingRight: 20,
    },
    galleryCard: {
      borderRadius: 28,
      height: 220,
      marginRight: 14,
      overflow: 'hidden',
      padding: 18,
      width: 270,
    },
    galleryImage: {
      ...StyleSheet.absoluteFillObject,
      opacity: 1,
    },
    galleryOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#11182740',
    },
    galleryLabel: {
      color: '#FFFFFF',
      fontFamily: Fonts.rounded,
      fontSize: 24,
      marginTop: 'auto',
      zIndex: 2,
    },
    galleryCaption: {
      color: '#F8FAFC',
      fontSize: 13,
      marginTop: 4,
      zIndex: 2,
    },
    detailTitle: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 28,
      marginTop: 18,
    },
    detailAvailabilityPill: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      marginTop: 10,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    detailAvailabilityGood: {
      backgroundColor: '#DCFCE7',
    },
    detailAvailabilityBad: {
      backgroundColor: '#FEE2E2',
    },
    detailAvailabilityText: {
      color: '#111111',
      fontFamily: Fonts.rounded,
      fontSize: 12,
    },
    factGrid: {
      marginTop: 20,
    },
    factCard: {
      backgroundColor: palette.background,
      borderRadius: 22,
      marginBottom: 12,
      padding: 16,
    },
    factLabel: {
      color: palette.muted,
      fontSize: 12,
      textTransform: 'uppercase',
    },
    factValue: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 16,
      lineHeight: 24,
      marginTop: 8,
    },
    landlordCard: {
      alignItems: 'center',
      backgroundColor: palette.background,
      borderRadius: 24,
      flexDirection: 'row',
      marginTop: 12,
      padding: 16,
    },
    landlordAvatar: {
      backgroundColor: palette.surface,
      borderRadius: 26,
      height: 52,
      width: 52,
    },
    landlordInfo: {
      marginLeft: 14,
    },
    landlordLabel: {
      color: palette.muted,
      fontSize: 12,
      textTransform: 'uppercase',
    },
    landlordName: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 17,
      marginTop: 4,
    },
    landlordPhone: {
      color: palette.text,
      fontSize: 14,
      marginTop: 4,
    },
    rentButton: {
      alignItems: 'center',
      borderRadius: 18,
      marginTop: 18,
      paddingVertical: 16,
    },
    rentButtonBase: {
      opacity: 1,
    },
    rentButtonLight: {
      backgroundColor: '#111111',
    },
    rentButtonDark: {
      backgroundColor: '#FFFFFF',
    },
    rentButtonText: {
      fontFamily: Fonts.rounded,
      fontSize: 16,
    },
    rentButtonTextLight: {
      color: '#FFFFFF',
    },
    rentButtonTextDark: {
      color: '#111111',
    },
  });
}

function colorWithAlpha(hex: string, opacity: number) {
  const normalized = hex.replace('#', '');
  const safeHex = normalized.length === 3
    ? normalized
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
    : normalized;
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');

  return `#${safeHex}${alpha}`;
}


















