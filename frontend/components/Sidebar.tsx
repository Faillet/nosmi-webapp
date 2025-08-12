import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { 
  Home,
  BookOpen, 
  Flask, 
  Package, 
  Heart, 
  User, 
  BarChart3,
  Settings,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: BookOpen, label: 'Apprendre', path: '/learn' },
    { icon: Flask, label: 'Créer', path: '/create' },
    { icon: Package, label: 'Ingrédients', path: '/ingredients' },
    { icon: Heart, label: 'Mes Formules', path: '/formulas' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: User, label: 'Profil', path: '/profile' },
    { icon: Settings, label: 'Paramètres', path: '/settings' },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-64 
          bg-white/60 backdrop-blur-md border-r border-gray-200 
          transform md:transform-none md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Close button - Mobile only */}
          <div className="flex justify-end p-4 md:hidden">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 pb-6">
            <div className="space-y-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = router.pathname === item.path;
                
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-black text-white shadow-lg' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </nav>

          {/* Quick Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="p-6 m-4 bg-gradient-to-r from-black/10 to-blue-500/10 rounded-xl"
          >
            <h3 className="font-semibold text-black mb-3">Statistiques</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Formules</span>
                <span className="text-sm font-medium text-black">47</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Ingrédients</span>
                <span className="text-sm font-medium text-black">238</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Heures</span>
                <span className="text-sm font-medium text-black">124h</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
