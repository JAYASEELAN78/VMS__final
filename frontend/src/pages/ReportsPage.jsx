import React from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';

const ReportsPage = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px]"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Package size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports Management</h1>
                    <p className="text-sm text-gray-500">Manage your reports here.</p>
                </div>
            </div>
            
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-500 font-medium">Coming Soon</p>
                    <p className="text-sm text-gray-400 mt-1">This module is under development.</p>
                </div>
            </div>
        </motion.div>
    );
};

export default ReportsPage;
