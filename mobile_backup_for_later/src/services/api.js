import axios from 'axios';
import Constants from 'expo-constants';

// Utiliser les variables d'environnement en priorité
const API_URL = 
  process.env.EXPO_PUBLIC_API_URL || 
  Constants.expoConfig?.extra?.apiUrl || 
  'https://digital-marketplace-186.preview.emergentagent.com/api';

console.log('API URL configurée:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré - gérer la déconnexion
      console.log('Token expiré');
    }
    return Promise.reject(error);
  }
);

export default api;
