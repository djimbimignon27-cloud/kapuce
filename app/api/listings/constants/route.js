import { NextResponse } from 'next/server';
import { SUB_CATEGORIES, ACCESSIBILITY_OPTIONS, REQUIRED_DOCUMENTS } from '@/lib/models/Listing';

// Villes du Gabon
const CITIES = [
  'Libreville',
  'Port-Gentil',
  'Franceville',
  'Oyem',
  'Moanda',
  'Mouila',
  'Lambaréné',
  'Tchibanga',
  'Koulamoutou',
  'Makokou',
  'Bitam',
  'Gamba',
  'Mitzic',
  'Lastoursville',
  'Ntoum',
  'Akanda',
  'Owendo',
];

// Marques de véhicules populaires
const CAR_BRANDS = [
  { value: 'TOYOTA', label: 'Toyota' },
  { value: 'MERCEDES', label: 'Mercedes-Benz' },
  { value: 'BMW', label: 'BMW' },
  { value: 'NISSAN', label: 'Nissan' },
  { value: 'HONDA', label: 'Honda' },
  { value: 'HYUNDAI', label: 'Hyundai' },
  { value: 'KIA', label: 'Kia' },
  { value: 'PEUGEOT', label: 'Peugeot' },
  { value: 'RENAULT', label: 'Renault' },
  { value: 'FORD', label: 'Ford' },
  { value: 'VOLKSWAGEN', label: 'Volkswagen' },
  { value: 'AUDI', label: 'Audi' },
  { value: 'LEXUS', label: 'Lexus' },
  { value: 'MITSUBISHI', label: 'Mitsubishi' },
  { value: 'SUZUKI', label: 'Suzuki' },
  { value: 'JEEP', label: 'Jeep' },
  { value: 'LAND_ROVER', label: 'Land Rover' },
  { value: 'ISUZU', label: 'Isuzu' },
  { value: 'MAZDA', label: 'Mazda' },
  { value: 'OTHER', label: 'Autre' },
];

// Types de carburant
const FUEL_TYPES = [
  { value: 'PETROL', label: 'Essence' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'ELECTRIC', label: 'Électrique' },
  { value: 'HYBRID', label: 'Hybride' },
  { value: 'LPG', label: 'GPL' },
];

// Types de transmission
const TRANSMISSION_TYPES = [
  { value: 'MANUAL', label: 'Manuelle' },
  { value: 'AUTOMATIC', label: 'Automatique' },
  { value: 'SEMI_AUTO', label: 'Semi-automatique' },
];

// États des biens
const CONDITION_OPTIONS = {
  PROPERTY: [
    { value: 'NEW', label: 'Neuf' },
    { value: 'EXCELLENT', label: 'Excellent état' },
    { value: 'GOOD', label: 'Bon état' },
    { value: 'FAIR', label: 'État correct' },
    { value: 'RENOVATE', label: 'À rénover' },
  ],
  VEHICLE: [
    { value: 'NEW', label: 'Neuf' },
    { value: 'EXCELLENT', label: 'Excellent état' },
    { value: 'GOOD', label: 'Bon état' },
    { value: 'FAIR', label: 'État correct' },
    { value: 'FOR_PARTS', label: 'Pour pièces' },
  ],
  LAND: [
    { value: 'FLAT', label: 'Plat' },
    { value: 'SLOPED', label: 'En pente' },
    { value: 'HILLY', label: 'Vallonné' },
    { value: 'MIXED', label: 'Mixte' },
  ],
};

// Options de meublé
const FURNISHED_OPTIONS = [
  { value: 'UNFURNISHED', label: 'Non meublé' },
  { value: 'SEMI_FURNISHED', label: 'Semi-meublé' },
  { value: 'FURNISHED', label: 'Meublé' },
];

// Équipements immobilier
const PROPERTY_AMENITIES = [
  { value: 'GARDEN', label: 'Jardin' },
  { value: 'POOL', label: 'Piscine' },
  { value: 'GARAGE', label: 'Garage' },
  { value: 'SECURITY', label: 'Sécurité 24h/24' },
  { value: 'ELEVATOR', label: 'Ascenseur' },
  { value: 'AC', label: 'Climatisation' },
  { value: 'HEATING', label: 'Chauffage' },
  { value: 'BALCONY', label: 'Balcon' },
  { value: 'TERRACE', label: 'Terrasse' },
  { value: 'STORAGE', label: 'Cave/Rangement' },
  { value: 'INTERCOM', label: 'Interphone' },
  { value: 'WATER_TANK', label: 'Citerne d\'eau' },
  { value: 'GENERATOR', label: 'Groupe électrogène' },
  { value: 'SOLAR', label: 'Panneaux solaires' },
];

// Options véhicule
const VEHICLE_FEATURES = [
  { value: 'AC', label: 'Climatisation' },
  { value: 'GPS', label: 'GPS' },
  { value: 'BLUETOOTH', label: 'Bluetooth' },
  { value: 'CAMERA', label: 'Caméra de recul' },
  { value: 'PARKING_SENSORS', label: 'Capteurs de stationnement' },
  { value: 'LEATHER_SEATS', label: 'Sièges en cuir' },
  { value: 'SUNROOF', label: 'Toit ouvrant' },
  { value: 'ALLOY_WHEELS', label: 'Jantes alliage' },
  { value: 'ABS', label: 'ABS' },
  { value: 'AIRBAGS', label: 'Airbags' },
  { value: 'CRUISE_CONTROL', label: 'Régulateur de vitesse' },
  { value: 'KEYLESS', label: 'Démarrage sans clé' },
  { value: '4WD', label: '4x4' },
];

// GET - Récupérer toutes les constantes
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      subCategories: SUB_CATEGORIES,
      accessibilityOptions: ACCESSIBILITY_OPTIONS,
      requiredDocuments: REQUIRED_DOCUMENTS,
      cities: CITIES,
      carBrands: CAR_BRANDS,
      fuelTypes: FUEL_TYPES,
      transmissionTypes: TRANSMISSION_TYPES,
      conditionOptions: CONDITION_OPTIONS,
      furnishedOptions: FURNISHED_OPTIONS,
      propertyAmenities: PROPERTY_AMENITIES,
      vehicleFeatures: VEHICLE_FEATURES,
    },
  });
}
