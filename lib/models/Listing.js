import mongoose from 'mongoose';

// Sous-catégories par type de bien
export const SUB_CATEGORIES = {
  LAND: [
    { value: 'RESIDENTIAL', label: 'Résidentiel' },
    { value: 'COMMERCIAL', label: 'Commercial' },
    { value: 'AGRICULTURAL', label: 'Agricole' },
    { value: 'INDUSTRIAL', label: 'Industriel' },
  ],
  HOUSE: [
    { value: 'HOUSE', label: 'Maison' },
    { value: 'APARTMENT', label: 'Appartement' },
    { value: 'VILLA', label: 'Villa' },
    { value: 'STUDIO', label: 'Studio' },
    { value: 'DUPLEX', label: 'Duplex' },
    { value: 'OFFICE', label: 'Bureau' },
    { value: 'SHOP', label: 'Local commercial' },
    { value: 'WAREHOUSE', label: 'Entrepôt' },
  ],
  CAR: [
    { value: 'CAR', label: 'Voiture' },
    { value: 'MOTORCYCLE', label: 'Moto' },
    { value: 'TRUCK', label: 'Camion' },
    { value: 'VAN', label: 'Utilitaire' },
    { value: 'BUS', label: 'Bus / Minibus' },
    { value: 'BOAT', label: 'Bateau' },
    { value: 'OTHER', label: 'Autre' },
  ],
};

// Types d'accessibilité pour les terrains
export const ACCESSIBILITY_OPTIONS = [
  { value: 'PAVED_ROAD', label: 'Route bitumée' },
  { value: 'DIRT_ROAD', label: 'Route en terre' },
  { value: 'WATER', label: 'Accès à l\'eau' },
  { value: 'ELECTRICITY', label: 'Électricité disponible' },
  { value: 'SEWAGE', label: 'Tout-à-l\'égout' },
  { value: 'INTERNET', label: 'Internet/Fibre' },
];

// Types de documents requis par type de bien
export const REQUIRED_DOCUMENTS = {
  LAND: [
    { value: 'LAND_TITLE', label: 'Titre foncier', required: true },
    { value: 'CADASTRE', label: 'Documents du cadastre', required: true },
    { value: 'SALE_DEED', label: 'Acte de vente', required: false },
    { value: 'SURVEY_PLAN', label: 'Plan de bornage', required: false },
    { value: 'TAX_CLEARANCE', label: 'Quitus fiscal', required: false },
  ],
  HOUSE: [
    { value: 'PROPERTY_TITLE', label: 'Titre de propriété', required: true },
    { value: 'BUILDING_PERMIT', label: 'Permis de construire', required: false },
    { value: 'OCCUPANCY_CERT', label: 'Certificat d\'habitabilité', required: false },
    { value: 'TAX_CLEARANCE', label: 'Quitus fiscal', required: false },
    { value: 'ENERGY_AUDIT', label: 'Diagnostic énergétique', required: false },
  ],
  CAR: [
    { value: 'REGISTRATION', label: 'Carte grise', required: true },
    { value: 'INSURANCE', label: 'Assurance valide', required: true },
    { value: 'TECHNICAL_CONTROL', label: 'Contrôle technique', required: true },
    { value: 'PURCHASE_INVOICE', label: 'Facture d\'achat', required: false },
    { value: 'MAINTENANCE_RECORD', label: 'Carnet d\'entretien', required: false },
  ],
};

// Schéma pour les documents uploadés
const DocumentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  publicId: String, // Pour Cloudinary
  fileName: String,
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  },
  rejectionReason: String,
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const ListingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['HOUSE', 'LAND', 'CAR'],
      required: true,
    },
    // Nouvelle sous-catégorie
    subCategory: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['RENT', 'SALE'],
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    neighborhood: {
      type: String, // Quartier
    },
    latitude: Number,
    longitude: Number,

    // ========================================
    // CHAMPS SPÉCIFIQUES POUR LES TERRAINS
    // ========================================
    landDetails: {
      surface: Number, // Superficie en m²
      length: Number, // Longueur en m
      width: Number, // Largeur en m
      topography: {
        type: String,
        enum: ['FLAT', 'SLOPED', 'HILLY', 'MIXED'],
      },
      soilType: String, // Type de sol
      zoning: String, // Zone (résidentielle, commerciale, etc.)
      accessibility: [String], // Routes, eau, électricité, etc.
      nearbyFacilities: [String], // Écoles, hôpitaux, marchés à proximité
      boundaryMarked: Boolean, // Terrain borné ou non
    },

    // ========================================
    // CHAMPS SPÉCIFIQUES POUR L'IMMOBILIER
    // ========================================
    propertyDetails: {
      surface: Number, // Surface habitable en m²
      landSurface: Number, // Surface du terrain en m²
      bedrooms: Number,
      bathrooms: Number,
      floors: Number, // Nombre d'étages
      yearBuilt: Number,
      condition: {
        type: String,
        enum: ['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'RENOVATE'],
      },
      furnished: {
        type: String,
        enum: ['UNFURNISHED', 'SEMI_FURNISHED', 'FURNISHED'],
      },
      parking: Number, // Nombre de places de parking
      hasGarden: Boolean,
      hasPool: Boolean,
      hasGarage: Boolean,
      hasSecurity: Boolean,
      hasElevator: Boolean,
      hasAC: Boolean,
      amenities: [String], // Équipements supplémentaires
    },

    // ========================================
    // CHAMPS SPÉCIFIQUES POUR LES VÉHICULES
    // ========================================
    vehicleDetails: {
      brand: String, // Marque
      model: String, // Modèle
      year: Number, // Année
      mileage: Number, // Kilométrage
      fuel: {
        type: String,
        enum: ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG'],
      },
      transmission: {
        type: String,
        enum: ['MANUAL', 'AUTOMATIC', 'SEMI_AUTO'],
      },
      color: String,
      doors: Number,
      seats: Number,
      engineSize: String, // Cylindrée
      power: String, // Puissance en CV
      condition: {
        type: String,
        enum: ['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'FOR_PARTS'],
      },
      previousOwners: Number,
      serviceHistory: Boolean, // Carnet d'entretien à jour
      warranty: Boolean, // Sous garantie
      features: [String], // Options (GPS, Climatisation, etc.)
    },

    // ========================================
    // MÉDIAS (Photos et Vidéos)
    // ========================================
    images: {
      type: [{
        url: String,
        publicId: String, // Pour Cloudinary
        caption: String,
        isPrimary: Boolean,
      }],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 5;
        },
        message: 'Maximum 5 photos autorisées'
      },
    },
    video: {
      url: String,
      publicId: String,
    },

    // ========================================
    // DOCUMENTS REQUIS
    // ========================================
    documents: {
      type: [DocumentSchema],
      default: [],
    },
    documentsStatus: {
      type: String,
      enum: ['INCOMPLETE', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'],
      default: 'INCOMPLETE',
    },
    documentsRejectionReason: String,

    // ========================================
    // STATUTS ET MODÉRATION
    // ========================================
    mediaStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    mediaRejectionReason: String,
    
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'ACTIVE', 'SOLD', 'RENTED', 'SUSPENDED', 'REJECTED'],
      default: 'PENDING',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    favoritesCount: {
      type: Number,
      default: 0,
    },
    rejectionReason: String,
    
    // Historique de modération
    moderationHistory: [{
      action: String,
      reason: String,
      by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      at: {
        type: Date,
        default: Date.now,
      },
    }],

    // Dates importantes
    publishedAt: Date,
    expiresAt: Date,
    soldAt: Date,
    rentedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index pour optimiser les recherches
ListingSchema.index({ type: 1, subCategory: 1, category: 1, city: 1 });
ListingSchema.index({ price: 1 });
ListingSchema.index({ status: 1 });
ListingSchema.index({ verified: 1 });
ListingSchema.index({ ownerId: 1 });
ListingSchema.index({ mediaStatus: 1 });
ListingSchema.index({ documentsStatus: 1 });
ListingSchema.index({ 'landDetails.surface': 1 });
ListingSchema.index({ 'propertyDetails.bedrooms': 1 });
ListingSchema.index({ 'vehicleDetails.brand': 1, 'vehicleDetails.model': 1 });
ListingSchema.index({ createdAt: -1 });

// Méthode pour vérifier si tous les documents requis sont présents
ListingSchema.methods.checkRequiredDocuments = function() {
  const requiredDocs = REQUIRED_DOCUMENTS[this.type] || [];
  const uploadedDocTypes = this.documents.map(d => d.type);
  
  const missingRequired = requiredDocs
    .filter(d => d.required)
    .filter(d => !uploadedDocTypes.includes(d.value));
  
  return {
    complete: missingRequired.length === 0,
    missing: missingRequired,
  };
};

export default mongoose.models.Listing || mongoose.model('Listing', ListingSchema);
