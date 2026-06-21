import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../App';

const { width } = Dimensions.get('window');

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=600',
  'https://images.unsplash.com/photo-1612637968894-660373e23b03?w=600',
];

export default function ListingDetailScreen({ route, navigation }) {
  const { listing } = route.params;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const images = listing.images?.length > 0 ? listing.images : DEMO_IMAGES;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleContact = (method) => {
    const phone = listing.ownerId?.phone || '+241 00 00 00 00';
    
    switch (method) {
      case 'call':
        Linking.openURL(`tel:${phone}`);
        break;
      case 'whatsapp':
        Linking.openURL(`whatsapp://send?phone=${phone.replace(/\s/g, '')}`);
        break;
      case 'email':
        Linking.openURL(`mailto:${listing.ownerId?.email || 'contact@kama.com'}`);
        break;
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    Alert.alert(
      isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris',
      isFavorite 
        ? 'Cette annonce a été retirée de vos favoris'
        : 'Cette annonce a été ajoutée à vos favoris'
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
          >
            {images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.image}
              />
            ))}
          </ScrollView>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)']}
            style={styles.imageGradient}
          />
          
          {/* Image Counter */}
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {currentImageIndex + 1} / {images.length}
            </Text>
          </View>

          {/* Badges */}
          <View style={styles.badgesContainer}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {listing.category === 'SALE' ? '🏷️ Vente' : '🏠 Location'}
              </Text>
            </View>
            {listing.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="white" />
                <Text style={styles.verifiedText}>Vérifié</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.actionButton} onPress={toggleFavorite}>
              <Ionicons 
                name={isFavorite ? 'heart' : 'heart-outline'} 
                size={24} 
                color={isFavorite ? '#EF4444' : 'white'} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Type Tag */}
          <View style={styles.typeTag}>
            <Ionicons 
              name={listing.type === 'HOUSE' ? 'home' : listing.type === 'CAR' ? 'car' : 'map'} 
              size={16} 
              color={COLORS.primary} 
            />
            <Text style={styles.typeText}>
              {listing.type === 'HOUSE' ? 'Immobilier' : listing.type === 'CAR' ? 'Véhicule' : 'Terrain'}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{listing.title}</Text>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color={COLORS.gold} />
            <Text style={styles.locationText}>{listing.address}, {listing.city}</Text>
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>
              {listing.category === 'RENT' ? 'Loyer mensuel' : 'Prix de vente'}
            </Text>
            <Text style={styles.price}>
              {formatPrice(listing.price)}
              {listing.category === 'RENT' && <Text style={styles.priceMonth}>/mois</Text>}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* Safety Tips */}
          <View style={styles.safetyCard}>
            <View style={styles.safetyHeader}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.gold} />
              <Text style={styles.safetyTitle}>Conseils de sécurité</Text>
            </View>
            <View style={styles.safetyTip}>
              <Ionicons name="checkmark" size={16} color={COLORS.success} />
              <Text style={styles.safetyText}>Visitez le bien avant tout paiement</Text>
            </View>
            <View style={styles.safetyTip}>
              <Ionicons name="checkmark" size={16} color={COLORS.success} />
              <Text style={styles.safetyText}>Vérifiez les documents de propriété</Text>
            </View>
            <View style={styles.safetyTip}>
              <Ionicons name="checkmark" size={16} color={COLORS.success} />
              <Text style={styles.safetyText}>Méfiez-vous des offres trop alléchantes</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Contact Bar */}
      <View style={styles.contactBar}>
        <TouchableOpacity 
          style={[styles.contactButton, styles.callButton]}
          onPress={() => handleContact('call')}
        >
          <Ionicons name="call" size={22} color="white" />
          <Text style={styles.contactButtonText}>Appeler</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.contactButton, styles.whatsappButton]}
          onPress={() => handleContact('whatsapp')}
        >
          <Ionicons name="logo-whatsapp" size={22} color="white" />
          <Text style={styles.contactButtonText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  image: {
    width: width,
    height: 300,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  imageCounterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  badgesContainer: {
    position: 'absolute',
    top: 15,
    left: 15,
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageActions: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    marginBottom: 12,
  },
  typeText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 15,
    color: COLORS.gray,
  },
  priceContainer: {
    backgroundColor: `${COLORS.gold}15`,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.gold,
  },
  priceMonth: {
    fontSize: 16,
    fontWeight: 'normal',
    color: COLORS.gray,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: COLORS.darkGray,
    lineHeight: 24,
  },
  safetyCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 100,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  safetyTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  contactBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 15,
    paddingBottom: 30,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 14,
    gap: 8,
  },
  callButton: {
    backgroundColor: COLORS.primary,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
