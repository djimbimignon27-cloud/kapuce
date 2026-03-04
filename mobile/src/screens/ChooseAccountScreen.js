import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../App';

export default function ChooseAccountScreen({ navigation }) {
  const accountTypes = [
    {
      type: 'USER',
      icon: 'person',
      title: 'Utilisateur',
      subtitle: 'Acheter ou louer un bien',
      description: 'Naviguez parmi des milliers d\'annonces vérifiées',
      color: '#3B82F6',
    },
    {
      type: 'OWNER',
      icon: 'home',
      title: 'Propriétaire',
      subtitle: 'Vendre ou louer votre bien',
      description: 'Publiez vos biens et gérez vos annonces',
      color: COLORS.gold,
      recommended: true,
    },
    {
      type: 'AGENCY',
      icon: 'business',
      title: 'Agence / Pro',
      subtitle: 'Solution professionnelle',
      description: 'Outils avancés pour les professionnels',
      color: COLORS.primary,
    },
  ];

  return (
    <LinearGradient
      colors={[COLORS.primary, '#1E3A8A', '#0B3D91']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>K</Text>
            </View>
            <Text style={styles.title}>Bienvenue sur KAMA</Text>
            <Text style={styles.subtitle}>Choisissez votre type de compte</Text>
          </View>

          {/* Account Types */}
          <View style={styles.cardsContainer}>
            {accountTypes.map((account) => (
              <TouchableOpacity
                key={account.type}
                style={styles.card}
                onPress={() => navigation.navigate('Register', { accountType: account.type })}
                activeOpacity={0.9}
              >
                {account.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>⭐ Recommandé</Text>
                  </View>
                )}
                <View style={[styles.iconContainer, { backgroundColor: account.color }]}>
                  <Ionicons name={account.icon} size={32} color="white" />
                </View>
                <Text style={styles.cardTitle}>{account.title}</Text>
                <Text style={styles.cardSubtitle}>{account.subtitle}</Text>
                <Text style={styles.cardDescription}>{account.description}</Text>
                <View style={styles.cardArrow}>
                  <Ionicons name="arrow-forward" size={20} color={account.color} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Déjà inscrit ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.gold,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  cardsContainer: {
    gap: 15,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  recommendedText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.gold,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  cardArrow: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  loginText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  loginLink: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
