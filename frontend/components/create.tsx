import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Beaker, Save, TestTube } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

interface Ingredient {
  _id: string;
  name: string;
  category: string;
  notePosition: string;
  intensity: number;
  price: number;
  origin: string;
}

interface FormulaIngredient {
  ingredient: Ingredient;
  percentage: number;
  position: string;
  notes?: string;
}

interface Formula {
  name: string;
  category: string;
  concentration: string;
  concept: string;
  description: string;
  volume: number;
  ingredients: FormulaIngredient[];
}

export default function CreateFormula() {
  const [currentStep, setCurrentStep] = useState(0);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);

  const [formula, setFormula] = useState<Formula>({
    name: 'Nouvelle Création',
    category: 'Floral',
    concentration: 'Eau de Parfum',
    concept: '',
    description: '',
    volume: 50,
    ingredients: []
  });

  const steps = [
    { title: 'Concept', icon: '💡', description: 'Définir l\'idée' },
    { title: 'Ingrédients', icon: '🌿', description: 'Sélectionner les essences' },
    { title: 'Équilibre', icon: '⚖️', description: 'Ajuster les proportions' },
    { title: 'Révision', icon: '✨', description: 'Finaliser la formule' }
  ];

  const categories = ['All', 'Citrus', 'Floral', 'Woody', 'Oriental', 'Fresh', 'Gourmand'];
  const concentrations = ['Parfum', 'Eau de Parfum', 'Eau de Toilette', 'Eau de Cologne'];

  useEffect(() => {
    loadIngredients();
  }, []);

  useEffect(() => {
    filterIngredients();
  }, [searchText, selectedCategory, availableIngredients]);

  const loadIngredients = async () => {
    try {
      const response = await api.get('/ingredients');
      setAvailableIngredients(response.data.data || []);
    } catch (error) {
      console.error('Erreur chargement ingrédients:', error);
      toast.error('Erreur lors du chargement des ingrédients');
    }
  };

  const filterIngredients = () => {
    let filtered = availableIngredients;

    if (searchText) {
      filtered = filtered.filter(ing => 
        ing.name.toLowerCase().includes(searchText.toLowerCase()) ||
        ing.category.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(ing => ing.category === selectedCategory);
    }

    setFilteredIngredients(filtered);
  };

  const addIngredient = (ingredient: Ingredient) => {
    if (formula.ingredients.find(fi => fi.ingredient._id === ingredient._id)) {
      toast.error('Cet ingrédient est déjà dans la formule');
      return;
    }

    const newIngredient: FormulaIngredient = {
      ingredient,
      percentage: 2.0,
      position: ingredient.notePosition,
      notes: ''
    };

    setFormula(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }));

    toast.success(`${ingredient.name} ajouté à la formule`);
  };

  const removeIngredient = (index: number) => {
    setFormula(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredientPercentage = (index: number, percentage: number) => {
    setFormula(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === index ? { ...ing, percentage } : ing
      )
    }));
  };

  const calculateBalance = () => {
    let topNotes = 0, heartNotes = 0, baseNotes = 0;

    formula.ingredients.forEach(ing => {
      switch (ing.position) {
        case 'Top': topNotes += ing.percentage; break;
        case 'Heart': heartNotes += ing.percentage; break;
        case 'Base': baseNotes += ing.percentage; break;
      }
    });

    const total = topNotes + heartNotes + baseNotes;

    return {
      topNotes: total > 0 ? (topNotes / total) * 100 : 0,
      heartNotes: total > 0 ? (heartNotes / total) * 100 : 0,
      baseNotes: total > 0 ? (baseNotes / total) * 100 : 0,
      totalConcentration: total
    };
  };

  const saveFormula = async () => {
    if (!formula.name.trim()) {
      toast.error('Le nom de la formule est requis');
      return;
    }

    if (formula.ingredients.length === 0) {
      toast.error('Au moins un ingrédient est requis');
      return;
    }

    setLoading(true);
    try {
      const formulaData = {
        ...formula,
        ingredients: formula.ingredients.map(fi => ({
          ingredient: fi.ingredient._id,
          percentage: fi.percentage,
          position: fi.position,
          notes: fi.notes
        }))
      };

      await api.post('/formulas', formulaData);
      toast.success('Formule sauvegardée avec succès !');
      
      // Reset form
      setFormula({
        name: 'Nouvelle Création',
        category: 'Floral',
        concentration: 'Eau de Parfum',
        concept: '',
        description: '',
        volume: 50,
        ingredients: []
      });
      setCurrentStep(0);
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const balance = calculateBalance();

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
              Créer une Nouvelle Formule
            </h1>
            <p className="text-lg text-gray-600">
              Concevez votre fragrance unique étape par étape
            </p>
          </div>
          
          <div className="flex space-x-4 mt-4 lg:mt-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gray-100 border border-gray-200 rounded-xl text-black hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>Brouillon</span>
            </motion.button>
            <motion.button
              onClick={saveFormula}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors shadow-lg flex items-center space-x-2 disabled:opacity-50"
            >
              <TestTube className="h-5 w-5" />
              <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-gray-200"
        >
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex flex-col items-center space-y-2 cursor-pointer ${
                  index === currentStep ? 'text-black' : 'text-gray-400'
                }`}
                onClick={() => setCurrentStep(index)}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                    index === currentStep
                      ? 'bg-black text-white'
                      : index < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.icon}
                </div>
                <div className="text-center">
                  <span className="font-medium text-sm">{step.title}</span>
                  <p className="text-xs text-gray-500 hidden sm:block">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 0 && (
              <ConceptStep formula={formula} onFormulaChange={setFormula} />
            )}
            {currentStep === 1 && (
              <IngredientsStep 
                availableIngredients={filteredIngredients}
                searchText={searchText}
                onSearchChange={setSearchText}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={categories}
                onAddIngredient={addIngredient}
              />
            )}
            {currentStep === 2 && (
              <BalanceStep 
                formula={formula}
                onUpdatePercentage={updateIngredientPercentage}
                onRemoveIngredient={removeIngredient}
                balance={balance}
              />
            )}
            {currentStep === 3 && (
              <ReviewStep formula={formula} balance={balance} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Formula */}
            <FormulaPreview formula={formula} balance={balance} />
            
            {/* Navigation */}
            <StepNavigation 
              currentStep={currentStep}
              totalSteps={steps.length}
              onStepChange={setCurrentStep}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Composants pour chaque étape
const ConceptStep = ({ formula, onFormulaChange }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-gray-200"
  >
    <h2 className="text-2xl font-bold text-black mb-6">Définir le Concept</h2>
    
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Nom de la formule *
        </label>
        <input
          type="text"
          value={formula.name}
          onChange={(e) => onFormulaChange(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
          placeholder="Ma création unique..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Catégorie *
          </label>
          <select
            value={formula.category}
            onChange={(e) => onFormulaChange(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black"
          >
            <option value="Floral">Floral</option>
            <option value="Citrus">Citrus</option>
            <option value="Woody">Boisé</option>
            <option value="Oriental">Oriental</option>
            <option value="Fresh">Frais</option>
            <option value="Gourmand">Gourmand</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Concentration
          </label>
          <select
            value={formula.concentration}
            onChange={(e) => onFormulaChange(prev => ({ ...prev, concentration: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black"
          >
            <option value="Parfum">Parfum (25-40%)</option>
            <option value="Eau de Parfum">Eau de Parfum (15-25%)</option>
            <option value="Eau de Toilette">Eau de Toilette (5-15%)</option>
            <option value="Eau de Cologne">Eau de Cologne (2-5%)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Concept / Inspiration
        </label>
        <textarea
          value={formula.concept}
          onChange={(e) => onFormulaChange(prev => ({ ...prev, concept: e.target.value }))}
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black"
          placeholder="Décrivez l'inspiration, l'émotion ou l'histoire derrière cette création..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Description détaillée
        </label>
        <textarea
          value={formula.description}
          onChange={(e) => onFormulaChange(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black"
          placeholder="Description complète de la fragrance, notes olfactives attendues..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Volume cible (ml)
        </label>
        <input
          type="number"
          value={formula.volume}
          onChange={(e) => onFormulaChange(prev => ({ ...prev, volume: parseInt(e.target.value) || 50 }))}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black"
          min="10"
          max="1000"
        />
      </div>
    </div>
  </motion.div>
);

const IngredientsStep = ({ 
  availableIngredients, 
  searchText, 
  onSearchChange, 
  selectedCategory, 
  onCategoryChange, 
  categories, 
  onAddIngredient 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    {/* Filtres */}
    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-black mb-6">Sélectionner les Ingrédients</h2>
      
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un ingrédient..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Liste des ingrédients */}
    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableIngredients.map(ingredient => (
          <IngredientCard 
            key={ingredient._id} 
            ingredient={ingredient} 
            onAdd={() => onAddIngredient(ingredient)}
          />
        ))}
      </div>
      
      {availableIngredients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucun ingrédient trouvé</p>
        </div>
      )}
    </div>
  </motion.div>
);

const IngredientCard = ({ ingredient, onAdd }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all"
  >
    <div className="flex justify-between items-start mb-3">
      <div>
        <h3 className="font-semibold text-black">{ingredient.name}</h3>
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
    
    <div className="flex justify-between items-center">
      <div className="text-sm text-gray-600">
        <p>Intensité: {ingredient.intensity}/10</p>
        <p>{ingredient.price}€/10ml</p>
      </div>
      <button
        onClick={onAdd}
        className="px-3 py-1 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  </motion.div>
);

const BalanceStep = ({ formula, onUpdatePercentage, onRemoveIngredient, balance }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-gray-200"
  >
    <h2 className="text-2xl font-bold text-black mb-6">Équilibrer la Formule</h2>
    
    <div className="space-y-6">
      {/* Graphique d'équilibre */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <h3 className="font-semibold mb-4">Répartition des Notes</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Notes de Tête</span>
            <span className="font-medium">{balance.topNotes.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full" 
              style={{ width: `${balance.topNotes}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span>Notes de Cœur</span>
            <span className="font-medium">{balance.heartNotes.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-pink-500 h-2 rounded-full" 
              style={{ width: `${balance.heartNotes}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span>Notes de Fond</span>
            <span className="font-medium">{balance.baseNotes.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full" 
              style={{ width: `${balance.baseNotes}%` }}
            />
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Concentration Totale:</strong> {balance.totalConcentration.toFixed(2)}%
          </p>
          {balance.totalConcentration > 30 && (
            <p className="text-sm text-red-600 mt-1">
              ⚠️ Concentration élevée - Vérifiez les risques d'irritation
            </p>
          )}
        </div>
      </div>

      {/* Liste des ingrédients avec contrôles */}
      <div className="space-y-4">
        <h3 className="font-semibold">Ingrédients de la Formule</h3>
        {formula.ingredients.map((ing, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium">{ing.ingredient.name}</h4>
                <p className="text-sm text-gray-500">{ing.ingredient.category} • {ing.position}</p>
              </div>
              <button
                onClick={() => onRemoveIngredient(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium">Pourcentage:</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={ing.percentage}
                onChange={(e) => onUpdatePercentage(index, parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 border border-gray-200 rounded"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>
        ))}
        
        {formula.ingredients.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            Aucun ingrédient ajouté. Retournez à l'étape précédente pour en ajouter.
          </p>
        )}
      </div>
    </div>
  </motion.div>
);

const ReviewStep = ({ formula, balance }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-gray-200"
  >
    <h2 className="text-2xl font-bold text-black mb-6">Révision Finale</h2>
    
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-3">Informations Générales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><strong>Nom:</strong> {formula.name}</div>
          <div><strong>Catégorie:</strong> {formula.category}</div>
          <div><strong>Concentration:</strong> {formula.concentration}</div>
          <div><strong>Volume:</strong> {formula.volume}ml</div>
        </div>
      </div>

      {formula.concept && (
        <div>
          <h3 className="font-semibold text-lg mb-3">Concept</h3>
          <p className="text-gray-700">{formula.concept}</p>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-lg mb-3">Composition</h3>
        <div className="space-y-2">
          {formula.ingredients.map((ing, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
              <span>{ing.ingredient.name}</span>
              <span className="font-medium">{ing.percentage}%</span>
            </div>
          ))}
        </div>
        <div className="mt-4 font-semibold">
          Total: {balance.totalConcentration.toFixed(2)}%
        </div>
      </div>

      <div className="p-4 bg-green-50 rounded-xl">
        <h3 className="font-semibold text-green-800 mb-2">✅ Formule Prête</h3>
        <p className="text-green-700 text-sm">
          Votre formule est complète et peut être sauvegardée. 
          Vous pourrez la modifier ultérieurement si nécessaire.
        </p>
      </div>
    </div>
  </motion.div>
);

const FormulaPreview = ({ formula, balance }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-gray-200"
  >
    <h3 className="font-semibold text-black mb-4">Aperçu de la Formule</h3>
    
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-lg">{formula.name}</h4>
        <p className="text-sm text-gray-600">{formula.category} • {formula.concentration}</p>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Ingrédients ({formula.ingredients.length})</p>
        <div className="space-y-1">
          {formula.ingredients.slice(0, 5).map((ing, index) => (
            <div key={index} className="flex justify-between text-xs">
              <span className="truncate">{ing.ingredient.name}</span>
              <span>{ing.percentage}%</span>
            </div>
          ))}
          {formula.ingredients.length > 5 && (
            <p className="text-xs text-gray-500">
              +{formula.ingredients.length - 5} autres...
            </p>
          )}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Concentration</p>
        <div className="text-lg font-bold">
          {balance.totalConcentration.toFixed(2)}%
        </div>
      </div>
    </div>
  </motion.div>
);

const StepNavigation = ({ currentStep, totalSteps, onStepChange }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-gray-200"
  >
    <div className="flex justify-between space-x-2">
      <button
        onClick={() => onStepChange(Math.max(0, currentStep - 1))}
        disabled={currentStep === 0}
        className="flex-1 py-2 px-4 bg-gray-100 text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
      >
        Précédent
      </button>
      <button
        onClick={() => onStepChange(Math.min(totalSteps - 1, currentStep + 1))}
        disabled={currentStep === totalSteps - 1}
        className="flex-1 py-2 px-4 bg-black text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >
        Suivant
      </button>
    </div>
    
    <div className="mt-4 text-center text-sm text-gray-500">
      Étape {currentStep + 1} sur {totalSteps}
    </div>
  </motion.div>
);
