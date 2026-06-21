import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS } from '../../App';

const { width } = Dimensions.get('window');

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=400',
  'https://images.unsplash.com/photo-1612637968894-660373e23b03?w=400',
  'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=400',
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await api.get('/listings');
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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'HOUSE': return 'home';
      case 'CAR': return 'car';
      case 'LAND': return 'map';
      default: return 'home';
    }
  };

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
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.listingGradient}
      />
      <View style={styles.listingBadge}>
        <Text style={styles.listingBadgeText}>
          {item.category === 'SALE' ? 'Vente' : 'Location'}
        </Text>
      </View>
      {item.verified && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={14} color="white" />
          <Text style={styles.verifiedText}>Vérifié</Text>
        </View>
      )}
      <View style={styles.listingInfo}>
        <Text style={styles.listingPrice}>{formatPrice(item.price)}</Text>
        <Text style={styles.listingTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.listingLocation}>
          <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
          <Text style={styles.listingCity}>{item.city}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const categories = [
    { type: 'HOUSE', label: 'Immobilier', icon: 'home', color: '#3B82F6' },
    { type: 'CAR', label: 'Véhicules', icon: 'car', color: '#10B981' },
    { type: 'LAND', label: 'Terrains', icon: 'map', color: '#F59E0B' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={[COLORS.primary, '#1E3A8A']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Bonjour {user?.fullName?.split(' ')[0]} 👋</Text>
              <Text style={styles.headerSubtitle}>Trouvez votre bien idéal</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="white" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <TouchableOpacity 
            style={styles.searchBar}
            onPress={() => navigation.navigate('Annonces')}
          >
            <Ionicons name="search" size={20} color={COLORS.gray} />
            <Text style={styles.searchPlaceholder}>Rechercher une annonce...</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <View style={styles.categoriesContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.type}
                style={styles.categoryCard}
                onPress={() => navigation.navigate('Annonces', { type: cat.type })}
              >
                <View style={[styles.categoryIcon, { backgroundColor: cat.color }]}>
                  <Ionicons name={cat.icon} size={24} color="white" />
                </View>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Annonces récentes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Annonces')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : listings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="home-outline" size={60} color={COLORS.gray} />
              <Text style={styles.emptyText}>Aucune annonce disponible</Text>
            </View>
          ) : (
            <FlatList
              data={listings.slice(0, 6)}
              renderItem={renderListingCard}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listingsContainer}
            />
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <LinearGradient
            colors={[COLORS.gold, '#D4A84B']}
            style={styles.statsCard}
          >
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{listings.length}+</Text>
                <Text style={styles.statLabel}>Annonces</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>98%</Text>
                <Text style={styles.statLabel}>Satisfaction</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>24/7</Text>
                <Text style={styles.statLabel}>Support</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.gold,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    gap: 10,
  },
  searchPlaceholder: {
    color: COLORS.gray,
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 15,
  },
  seeAllText: {
    color: COLORS.gold,
    fontWeight: '600',
    marginBottom: 15,
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryCard: {
    alignItems: 'center',
    width: (width - 60) / 3,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  listingsContainer: {
    paddingRight: 20,
  },
  listingCard: {
    width: 200,
    height: 250,
    borderRadius: 20,
    marginRight: 15,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  listingGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  listingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  listingBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  verifiedText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  listingInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
  },
  listingPrice: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  listingTitle: {
    color: COLORS.white,
    fontSize: 14,
    marginBottom: 6,
  },
  listingLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listingCity: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: COLORS.gray,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 16,
    marginTop: 10,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  statsCard: {
    borderRadius: 20,
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
