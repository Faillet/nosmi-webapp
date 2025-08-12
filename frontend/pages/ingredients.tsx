import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, Star, Package, MapPin } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

interface Ingredient {
  _id: string;
  name: string;
  category: string;
  notePosition: string;
  intensity: number;
  longevity: number;
  sillage: number;
  price: number;
  origin: string;
  description: string;
  allergens: string[];
  safetyRating: string;
  stockQuantity: number;
  usage: {
    timesUsed: number;
    popularityScore: number;
  };
}

export default function IngredientsLibrary() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = ['All', 'Citrus', 'Floral', 'Woody', 'Oriental', 'Fresh', 'Gourmand', 'Aromatic'];
  const positions = ['All', 'Top', 'Heart', 'Base'];
  const sortOptions = [
    { value: 'name', label: 'Nom A-Z' },
    { value: '-name', label: 'Nom Z-A' },
    { value: '-price', label: 'Prix décroissant' },
    { value: 'price', label: 'Prix croissant' },
    { value: '-intensity', label: 'Intensité forte' },
    { value: '-usage.popularityScore', label: 'Popularité' }
  ];

  useEffect(() => {
    loadIngredients();
  }, []);

  useEffect(() => {
    filterIngredients();
  }, [searchText, selectedCategory, selectedPosition, sortBy, ingredients]);

  const loadIngredients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ingredients');
      setIngredients(response.data.data || []);
    } catch (error) {
      console.error('Erreur chargement ingrédients:', error);
      toast.error('Erreur lors du chargement des ingrédients');
    } finally {
      setLoading(false);
    }
  };

  const filterIngredients = () => {
    let filtered = [...ingredients];

    // Recherche textuelle
    if (searchText) {
      filtered = filtered.filter(ing => 
        ing.name.toLowerCase().includes(searchText.toLowerCase()) ||
        ing.category.toLowerCase().includes(searchText.toLowerCase()) ||
        ing.origin.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filtres par catégorie
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(ing => ing.category === selectedCategory);
    }

    // Filtres par position
    if (selectedPosition !== 'All') {
      filtered = filtered.filter(ing => ing.notePosition === selectedPosition);
    }

    // Tri
    filtered.sort((a, b) => {
      if (sortBy.startsWith('-')) {
        const field = sortBy.substring(1);
        return getNestedValue(b, field) - getNestedValue(a, field);
      } else {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return getNestedValue(a, sortBy) - getNestedValue(b, sortBy);
      }
    });

    setFilteredIngredients(filtered);
  };

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((o, p) => o && o[p], obj) || 0;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold text-black mb-2">
              Bibliothèque d'Ingrédients
            </h1>
            <p className="text-lg text-gray-600">
              Découvrez notre collection de {ingredients.length} essences naturelles
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <button className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
              <Filter className="h-5 w-5" />
            </button>
            <button className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Ajouter</span>
            </button>
          </div>
        </motion.div>

        {/* Filtres et Recherche */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-gray-200"
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Rechercher par nom, catégorie, origine..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            {/* Filtres */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'All' ? 'Toutes catégories' : category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtres secondaires */}
          <div className="flex flex-wrap gap-2 mt-4">
            {positions.map(position => (
              <button
                key={position}
                onClick={() => setSelectedPosition(position)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedPosition === position
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {position === 'All' ? 'Toutes positions' : `Notes ${position.toLowerCase()}`}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Statistiques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <StatsCard
            title="Total Ingrédients"
            value={ingredients.length}
            icon={Package}
            color="bg-blue-500"
          />
          <StatsCard
            title="Catégories"
            value={new Set(ingredients.map(i => i.category)).size}
            icon={Filter}
            color="bg-green-500"
          />
          <StatsCard
            title="Origines"
            value={new Set(ingredients.map(i => i.origin)).size}
            icon={MapPin}
            color="bg-purple-500"
          />
          <StatsCard
            title="Prix Moyen"
            value={`${(ingredients.reduce((sum, i) => sum + i.price, 0) / ingredients.length).toFixed(0)}€`}
            icon={Star}
            color="bg-orange-500"
          />
        </motion.div>

        {/* Liste des ingrédients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-gray-200"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-black">
              {filteredIngredients.length} ingrédient{filteredIngredients.length > 1 ? 's' : ''}
            </h2>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-gray-100'}`}
              >
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-black text-white' : 'bg-gray-100'}`}
              >
                <div className="w-4 h-4 flex flex-col justify-between">
                  <div className="bg-current h-0.5 rounded"></div>
                  <div className="bg-current h-0.5 rounded"></div>
                  <div className="bg-current h-0.5 rounded"></div>
                </div>
              </button>
            </div>
          </div>

          {filteredIngredients.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredIngredients.map(ingredient => (
                  <IngredientCard key={ingredient._id} ingredient={ingredient} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIngredients.map(ingredient => (
                  <IngredientRow key={ingredient._id} ingredient={ingredient} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun ingrédient trouvé</h3>
              <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}

const StatsCard = ({ title, value, icon: Icon, color }) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} text-white`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
    
    <div className="space-y-1">
      <p className="text-2xl font-bold text-black">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  </motion.div>
);

const IngredientCard = ({ ingredient }) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300"
  >
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="font-semibold text-black text-lg">{ingredient.name}</h3>
        <p className="text-sm text-gray-500">{ingredient.category}</p>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        ingredient.notePosition === 'Top' ? 'bg-yellow-100 text-yellow-800' :
        ingredient.notePosition === 'Heart' ? 'bg-pink-100 text-pink-800' :
        'bg-purple-100 text-purple-800'
      }`}>
        {ingredient.notePosition}
      </span>
    </div>

    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Intensité</span>
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < ingredient.intensity / 2 ? 'bg-black' : 'bg-gray-200'
              }`}
            />
          ))}
          <span className="ml-1 font-medium">{ingredient.intensity}/10</span>
        </div>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Tenue</span>
        <span className="font-medium">{ingredient.longevity}h</span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Origine</span>
        <span className="font-medium">{ingredient.origin}</span>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-black">{ingredient.price}€</span>
          <span className="text-xs text-gray-500">pour 10ml</span>
        </div>
      </div>

      {ingredient.usage?.timesUsed > 0 && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>Utilisé {ingredient.usage.timesUsed} fois</span>
          <span className="flex items-center">
            <Star className="h-3 w-3 text-yellow-500 mr-1" />
            {ingredient.usage.popularityScore?.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  </motion.div>
);

const IngredientRow = ({ ingredient }) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div>
          <h3 className="font-semibold text-black">{ingredient.name}</h3>
          <p className="text-sm text-gray-500">
            {ingredient.category} • {ingredient.origin}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          ingredient.notePosition === 'Top' ? 'bg-yellow-100 text-yellow-800' :
          ingredient.notePosition === 'Heart' ? 'bg-pink-100 text-pink-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {ingredient.notePosition}
        </span>

        <div className="text-sm text-gray-600">
          <div>Intensité: {ingredient.intensity}/10</div>
          <div>Tenue: {ingredient.longevity}h</div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-black">{ingredient.price}€</div>
          <div className="text-xs text-gray-500">10ml</div>
        </div>
      </div>
    </div>
  </motion.div>
);
