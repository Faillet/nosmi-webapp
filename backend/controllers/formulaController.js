const Formula = require('../models/Formula');
const Ingredient = require('../models/Ingredient');
const { validationResult } = require('express-validator');

class FormulaController {
  // GET /api/formulas - Récupérer toutes les formules de l'utilisateur
  async getAllFormulas(req, res) {
    try {
      const { page = 1, limit = 10, search, category, status, sortBy = 'createdAt' } = req.query;
      const userId = req.user.id;

      // Construction des filtres
      const filters = { creator: userId };
      
      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { concept: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (category && category !== 'all') {
        filters.category = category;
      }
      
      if (status && status !== 'all') {
        filters.status = status;
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Exécution des requêtes
      const [formulas, totalCount] = await Promise.all([
        Formula.find(filters)
          .populate('ingredients.ingredient', 'name category price notePosition')
          .sort({ [sortBy]: sortBy === 'name' ? 1 : -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Formula.countDocuments(filters)
      ]);

      // Calcul des métriques pour chaque formule
      const formulasWithMetrics = formulas.map(formula => ({
        ...formula,
        balance: this.calculateBalance(formula.ingredients),
        costPerMl: formula.volume > 0 ? formula.cost / formula.volume : 0,
        averageRating: formula.ratings?.average || 0
      }));

      res.json({
        success: true,
        data: {
          formulas: formulasWithMetrics,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / parseInt(limit)),
            totalItems: totalCount,
            itemsPerPage: parseInt(limit),
            hasNext: skip + parseInt(limit) < totalCount,
            hasPrev: parseInt(page) > 1
          }
        }
      });
    } catch (error) {
      console.error('Error fetching formulas:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des formules',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/formulas/:id - Récupérer une formule spécifique
  async getFormulaById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const formula = await Formula.findOne({ _id: id, creator: userId })
        .populate('ingredients.ingredient')
        .populate('creator', 'username email firstName lastName');

      if (!formula) {
        return res.status(404).json({
          success: false,
          message: 'Formule non trouvée'
        });
      }

      // Incrémenter les vues
      formula.analytics.views += 1;
      await formula.save();

      // Calculs avancés
      const balance = this.calculateBalance(formula.ingredients);
      const recommendations = this.generateRecommendations(formula);

      res.json({
        success: true,
        data: {
          formula,
          balance,
          recommendations,
          costAnalysis: {
            totalCost: formula.cost,
            costPerMl: formula.volume > 0 ? formula.cost / formula.volume : 0,
            mostExpensiveIngredient: this.findMostExpensiveIngredient(formula.ingredients)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching formula:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la formule',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // POST /api/formulas - Créer une nouvelle formule
  async createFormula(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const formulaData = {
        ...req.body,
        creator: userId,
        batchNumber: this.generateBatchNumber()
      };

      // Vérification des ingrédients
      if (formulaData.ingredients && formulaData.ingredients.length > 0) {
        const ingredientIds = formulaData.ingredients.map(ing => ing.ingredient);
        const validIngredients = await Ingredient.find({ _id: { $in: ingredientIds } });
        
        if (validIngredients.length !== ingredientIds.length) {
          return res.status(400).json({
            success: false,
            message: 'Un ou plusieurs ingrédients sont invalides'
          });
        }
      }

      const formula = new Formula(formulaData);
      
      // Calculs automatiques
      formula.calculateTotalConcentration();
      if (formulaData.ingredients) {
        await formula.populate('ingredients.ingredient');
        formula.calculateTotalCost();
      }

      await formula.save();
      
      // Population pour la réponse
      await formula.populate('ingredients.ingredient creator', 'username email firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Formule créée avec succès',
        data: formula
      });
    } catch (error) {
      console.error('Error creating formula:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la formule',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // PUT /api/formulas/:id - Mettre à jour une formule
  async updateFormula(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      // Vérifier que la formule appartient à l'utilisateur
      const formula = await Formula.findOne({ _id: id, creator: userId });
      if (!formula) {
        return res.status(404).json({
          success: false,
          message: 'Formule non trouvée'
        });
      }

      // Mise à jour des ingrédients si fournis
      if (updateData.ingredients) {
        const ingredientIds = updateData.ingredients.map(ing => ing.ingredient);
        const validIngredients = await Ingredient.find({ _id: { $in: ingredientIds } });
        
        if (validIngredients.length !== ingredientIds.length) {
          return res.status(400).json({
            success: false,
            message: 'Un ou plusieurs ingrédients sont invalides'
          });
        }
      }

      // Application des mises à jour
      Object.keys(updateData).forEach(key => {
        if (key !== 'creator' && key !== 'batchNumber') { // Protection des champs sensibles
          formula[key] = updateData[key];
        }
      });

      // Recalculs automatiques
      formula.calculateTotalConcentration();
      if (updateData.ingredients) {
        await formula.populate('ingredients.ingredient');
        formula.calculateTotalCost();
      }

      await formula.save();
      await formula.populate('ingredients.ingredient creator');

      res.json({
        success: true,
        message: 'Formule mise à jour avec succès',
        data: formula
      });
    } catch (error) {
      console.error('Error updating formula:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la formule',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // DELETE /api/formulas/:id - Supprimer une formule
  async deleteFormula(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const formula = await Formula.findOneAndDelete({ _id: id, creator: userId });
      
      if (!formula) {
        return res.status(404).json({
          success: false,
          message: 'Formule non trouvée'
        });
      }

      res.json({
        success: true,
        message: 'Formule supprimée avec succès'
      });
    } catch (error) {
      console.error('Error deleting formula:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la formule',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // POST /api/formulas/:id/test - Ajouter un résultat de test
  async addTestResult(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const testData = req.body;

      const formula = await Formula.findOne({ _id: id, creator: userId });
      if (!formula) {
        return res.status(404).json({
          success: false,
          message: 'Formule non trouvée'
        });
      }

      formula.testResults.push(testData);
      
      // Recalcul de la moyenne des notes
      const totalRatings = formula.testResults.length;
      const sumRatings = formula.testResults.reduce((sum, result) => sum + result.rating, 0);
      
      formula.ratings.average = sumRatings / totalRatings;
      formula.ratings.count = totalRatings;

      await formula.save();

      res.json({
        success: true,
        message: 'Résultat de test ajouté avec succès',
        data: {
          testResult: formula.testResults[formula.testResults.length - 1],
          newAverage: formula.ratings.average
        }
      });
    } catch (error) {
      console.error('Error adding test result:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout du résultat de test',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // GET /api/formulas/:id/analytics - Analytics d'une formule
  async getFormulaAnalytics(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const formula = await Formula.findOne({ _id: id, creator: userId })
        .populate('ingredients.ingredient');

      if (!formula) {
        return res.status(404).json({
          success: false,
          message: 'Formule non trouvée'
        });
      }

      const analytics = {
        basic: {
          views: formula.analytics.views,
          likes: formula.analytics.likes,
          shares: formula.analytics.shares,
          testCount: formula.testResults.length,
          averageRating: formula.ratings.average
        },
        composition: {
          totalIngredients: formula.ingredients.length,
          totalConcentration: formula.totalConcentration,
          balance: this.calculateBalance(formula.ingredients),
          categoryDistribution: this.getCategoryDistribution(formula.ingredients)
        },
        financial: {
          totalCost: formula.cost,
          costPerMl: formula.volume > 0 ? formula.cost / formula.volume : 0,
          profitMargin: formula.sellingPrice && formula.cost > 0 
            ? ((formula.sellingPrice - formula.cost) / formula.sellingPrice) * 100 
            : null
        },
        performance: {
          averageLongevity: this.calculateAverageMetric(formula.testResults, 'longevity'),
          averageSillage: this.calculateAverageMetric(formula.testResults, 'sillage'),
          ratingTrend: this.calculateRatingTrend(formula.testResults)
        }
      };

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching formula analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Méthodes utilitaires privées
  generateBatchNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `NOS-${year}${month}${day}-${random}`;
  }

  calculateBalance(ingredients) {
    let topNotes = 0, heartNotes = 0, baseNotes = 0;
    
    ingredients.forEach(ing => {
      switch (ing.position) {
        case 'Top': topNotes += ing.percentage; break;
        case 'Heart': heartNotes += ing.percentage; break;
        case 'Base': baseNotes += ing.percentage; break;
      }
    });
    
    const total = topNotes + heartNotes + baseNotes;
    
    if (total === 0) {
      return { topNotes: 0, heartNotes: 0, baseNotes: 0, score: 0, recommendations: [] };
    }
    
    const topRatio = topNotes / total;
    const heartRatio = heartNotes / total;
    const baseRatio = baseNotes / total;
    
    // Score basé sur les ratios idéaux : 20% top, 50% heart, 30% base
    const topScore = Math.max(0, 10 - Math.abs(topRatio - 0.2) * 50);
    const heartScore = Math.max(0, 10 - Math.abs(heartRatio - 0.5) * 20);
    const baseScore = Math.max(0, 10 - Math.abs(baseRatio - 0.3) * 33);
    
    const overallScore = (topScore + heartScore + baseScore) / 3;
    
    const recommendations = [];
    if (topRatio < 0.15) recommendations.push('Ajouter plus de notes de tête pour la fraîcheur');
    if (heartRatio < 0.4) recommendations.push('Renforcer le cœur avec des notes florales');
    if (baseRatio < 0.25) recommendations.push('Ajouter des notes de fond pour la tenue');
    if (total > 30) recommendations.push('Concentration élevée - vérifier les risques d\'irritation');
    
    return {
      topNotes: (topRatio * 100).toFixed(1),
      heartNotes: (heartRatio * 100).toFixed(1),
      baseNotes: (baseRatio * 100).toFixed(1),
      totalConcentration: total.toFixed(2),
      score: overallScore.toFixed(1),
      recommendations
    };
  }

  generateRecommendations(formula) {
    const recommendations = [];
    const balance = this.calculateBalance(formula.ingredients);
    
    // Recommandations basées sur l'équilibre
    if (parseFloat(balance.score) < 6) {
      recommendations.push({
        type: 'balance',
        priority: 'high',
        message: 'L\'équilibre olfactif peut être amélioré',
        suggestions: balance.recommendations
      });
    }
    
    // Recommandations de coût
    if (formula.cost > 100) {
      recommendations.push({
        type: 'cost',
        priority: 'medium',
        message: 'Coût élevé - considérer des alternatives moins chères',
        suggestions: ['Remplacer les ingrédients les plus chers', 'Réduire les pourcentages']
      });
    }
    
    // Recommandations de complexité
    if (formula.ingredients.length > 15) {
      recommendations.push({
        type: 'complexity',
        priority: 'low',
        message: 'Formule complexe - simplification possible',
        suggestions: ['Éliminer les ingrédients redondants', 'Combiner les notes similaires']
      });
    }
    
    return recommendations;
  }

  findMostExpensiveIngredient(ingredients) {
    if (!ingredients.length) return null;
    
    return ingredients.reduce((most, current) => {
      const currentCost = current.ingredient?.price * (current.percentage / 100) || 0;
      const mostCost = most.ingredient?.price * (most.percentage / 100) || 0;
      return currentCost > mostCost ? current : most;
    });
  }

  getCategoryDistribution(ingredients) {
    const distribution = {};
    let total = 0;
    
    ingredients.forEach(ing => {
      const category = ing.ingredient?.category || 'Unknown';
      const percentage = ing.percentage;
      
      if (!distribution[category]) {
        distribution[category] = 0;
      }
      
      distribution[category] += percentage;
      total += percentage;
    });
    
    // Convertir en pourcentages
    Object.keys(distribution).forEach(category => {
      distribution[category] = ((distribution[category] / total) * 100).toFixed(1);
    });
    
    return distribution;
  }

  calculateAverageMetric(testResults, metric) {
    if (!testResults.length) return 0;
    
    const validResults = testResults.filter(result => result[metric] != null);
    if (!validResults.length) return 0;
    
    const sum = validResults.reduce((total, result) => total + result[metric], 0);
    return (sum / validResults.length).toFixed(1);
  }

  calculateRatingTrend(testResults) {
    if (testResults.length < 2) return 'stable';
    
    const recent = testResults.slice(-3);
    const older = testResults.slice(-6, -3);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, r) => sum + r.rating, 0) / recent.length;
    const olderAvg = older.reduce((sum, r) => sum + r.rating, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 0.5) return 'improving';
    if (difference < -0.5) return 'declining';
    return 'stable';
  }
}

module.exports = new FormulaController();
