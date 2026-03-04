import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { COLORS } from '../../App';

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=400',
  'https://images.unsplash.com/photo-1612637968894-660373e23b03?w=400',
  'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=400',
];

export default function ListingsScreen({ navigation, route }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState(route.params?.type || 'all');

  useEffect(() => {
    fetchListings();
  }, [selectedType]);

  const fetchListings = async () => {
    try {
      let url = '/listings';
      if (selectedType !== 'all') {
        url = `/listings?type=${selectedType}`;
      }
      const response = await api.get(url);
      setListings(response.data.listings || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filterTypes = [
    { value: 'all', label: 'Tous', icon: 'grid' },
    { value: 'HOUSE', label: 'Immobilier', icon: 'home' },
    { value: 'CAR', label: 'Véhicules', icon: 'car' },
    { value: 'LAND', label: 'Terrains', icon: 'map' },
  ];

  const filteredListings = listings.filter(listing =>
    listing.title?.toLowerCase().includes(searchText.toLowerCase()) ||
    listing.city?.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderListingCard = ({ item, index }) => (
    <TouchableOpacity
      style={styles.listingCard}
      onPress={() => navigation.navigate('ListingDetail', { listing: item })}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.images?.[0] || DEMO_IMAGES[index % DEMO_IMAGES.length] }}
        style={styles.listingImage}
      />
      <View style={styles.listingBadge}>
        <Text style={styles.listingBadgeText}>
          {item.category === 'SALE' ? 'Vente' : 'Location'}
        </Text>
      </View>
      {item.verified && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={12} color="white" />
        </View>
      )}
      <View style={styles.listingContent}>
        <View style={styles.typeTag}>
          <Ionicons 
            name={item.type === 'HOUSE' ? 'home' : item.type === 'CAR' ? 'car' : 'map'} 
            size={12} 
            color={COLORS.primary} 
          />
          <Text style={styles.typeText}>
            {item.type === 'HOUSE' ? 'Immobilier' : item.type === 'CAR' ? 'Véhicule' : 'Terrain'}
          </Text>
        </View>
        <Text style={styles.listingTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.listingLocation}>
          <Ionicons name="location" size={14} color={COLORS.gold} />
          <Text style={styles.listingCity}>{item.city}</Text>
        </View>
        <Text style={styles.listingPrice}>{formatPrice(item.price)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor={COLORS.gray}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filterTypes.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterTab,
              selectedType === filter.value && styles.filterTabActive,
            ]}
            onPress={() => setSelectedType(filter.value)}
          >
            <Ionicons
              name={filter.icon}
              size={16}
              color={selectedType === filter.value ? COLORS.white : COLORS.gray}
            />
            <Text
              style={[
                styles.filterText,
                selectedType === filter.value && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredListings.length} annonce{filteredListings.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Listings */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : filteredListings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={60} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>Aucune annonce trouvée</Text>
          <Text style={styles.emptyText}>Essayez de modifier vos critères</Text>
        </View>
      ) : (
        <FlatList
          data={filteredListings}
          renderItem={renderListingCard}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  searchContainer: {
    padding: 15,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  resultsHeader: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  listingCard: {
    flex: 1,
    margin: 5,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  listingImage: {
    width: '100%',
    height: 120,
  },
  listingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  listingBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.success,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingContent: {
    padding: 12,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  typeText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 6,
    minHeight: 36,
  },
  listingLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  listingCity: {
    fontSize: 12,
    color: COLORS.gray,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.gray,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 15,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
  },
});
