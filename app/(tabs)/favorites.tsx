import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StarIcon } from '@/components/ui/app-icons';
import { useAppPreferences } from '@/context/app-preferences';
import { HOME_LISTINGS } from '@/constants/homes';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const styles = createStyles(palette);
  const { favorites, isFavorite, toggleFavorite } = useAppPreferences();
  const favoriteHomes = HOME_LISTINGS.filter((home) => favorites.includes(home.id));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved homes</Text>
        <Text style={styles.subtitle}>Your shortlist lives here.</Text>
      </View>

      {favoriteHomes.length === 0 ? (
        <View style={styles.emptyState}>
          <StarIcon size={30} fill={palette.icon} />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyText}>
            Save any home from the map sheet and it will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favoriteHomes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardArea}>{item.area}</Text>
                </View>
                <Pressable
                  onPress={() => toggleFavorite(item.id)}
                  hitSlop={10}
                  style={styles.favoriteButton}>
                  <StarIcon size={18} fill={isFavorite(item.id) ? palette.tabIconSelected : palette.icon} />
                </Pressable>
              </View>

              <Text style={styles.cardPrice}>{item.price}</Text>
              <Text style={styles.cardMeta}>
                {item.beds} bed | {item.baths} bath | {item.size} sqm
              </Text>
              <Text style={styles.cardFooter}>{item.availability}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(palette: typeof Colors.light) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    title: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 30,
    },
    subtitle: {
      color: palette.muted,
      fontSize: 14,
      marginTop: 6,
    },
    emptyState: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
    },
    emptyTitle: {
      color: palette.text,
      fontFamily: Fonts.rounded,
      fontSize: 22,
      marginTop: 16,
    },
    emptyText: {
      color: palette.muted,
      fontSize: 14,
      lineHeight: 22,
      marginTop: 8,
      textAlign: 'center',
    },
    listContent: {
      paddingBottom: 28,
      paddingHorizontal: 20,
      paddingTop: 18,
    },
    card: {
      backgroundColor: palette.surface,
      borderRadius: 24,
      marginBottom: 14,
      padding: 18,
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
    cardPrice: {
      color: palette.accent,
      fontFamily: Fonts.rounded,
      fontSize: 16,
      marginTop: 16,
    },
    cardMeta: {
      color: palette.text,
      fontSize: 13,
      marginTop: 6,
    },
    cardFooter: {
      color: palette.muted,
      fontSize: 12,
      marginTop: 14,
    },
  });
}


