import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Beaker } from 'lucide-react';
import Layout from '../../components/Layout';
import FormulaBuilder from '../../components/FormulaBuilder';
import IngredientPalette from '../../components/IngredientPalette';
import FormulaBalance from '../../components/FormulaBalance';

const CreateFormula: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formula, setFormula] = useState({
    name: 'New Creation',
    ingredients: [],
    notes: '',
    concentration: 'eau-de-parfum'
  });

  const steps = [
    { title: 'Concept', icon: '💡' },
    { title: 'Ingredients', icon: '🌿' },
    { title: 'Balance', icon: '⚖️' },
    { title: 'Testing', icon: '🧪' },
    { title: 'Finalize', icon: '✨' }
  ];

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
            <h1 className="text-4xl font-bold text-nosmi-primary mb-2">
              Create New Formula
            </h1>
            <p className="text-lg text-nosmi-secondary">
              Design your unique fragrance composition
            </p>
          </div>
          
          <div className="flex space-x-4 mt-4 lg:mt-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-nosmi-surface border border-nosmi-border rounded-xl text-nosmi-primary hover:bg-nosmi-border transition-colors"
            >
              Save Draft
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-nosmi-accent text-white rounded-xl hover:bg-nosmi-primary transition-colors shadow-lg"
            >
              <Beaker className="inline h-5 w-5 mr-2" />
              Test Formula
            </motion.button>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-nosmi-border"
        >
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 ${
                  index === currentStep ? 'text-nosmi-accent' : 'text-nosmi-secondary'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    index === currentStep
                      ? 'bg-nosmi-accent text-white'
                      : index < currentStep
                      ? 'bg-nosmi-success text-white'
                      : 'bg-nosmi-surface text-nosmi-secondary'
                  }`}
                >
                  {step.icon}
                </div>
                <span className="font-medium hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Main Creation Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Formula Builder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <FormulaBuilder formula={formula} onFormulaChange={setFormula} />
          </motion.div>

          {/* Ingredient Palette */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1"
          >
            <IngredientPalette onIngredientAdd={(ingredient) => {
              // Add ingredient to formula logic
            }} />
          </motion.div>

          {/* Formula Balance */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-1"
          >
            <FormulaBalance formula={formula} />
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateFormula;
