import React from 'react';
import { Settings } from 'lucide-react';

interface ConfigPanelProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
  seed: number;
  setSeed: (seed: number) => void;
}

const MODELS = [
  "deepseek-ai/DeepSeek-V3.2",
  "deepseek-ai/DeepSeek-V3",
  "deepseek-ai/DeepSeek-R1",
  "Qwen/Qwen2.5-72B-Instruct",
  "meta-llama/Meta-Llama-3.1-70B-Instruct",
];

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ apiKey, setApiKey, model, setModel, seed, setSeed }) => {
  const handleSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setSeed(0);
    } else {
      const num = parseInt(value);
      if (!isNaN(num)) {
        setSeed(num);
      }
    }
  };

  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 1000000);
    setSeed(randomSeed);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
        <Settings size={24} />
        Settings
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SiliconFlow API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="sk-..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
             {MODELS.map(m => (
                 <option key={m} value={m}>{m}</option>
             ))}
             <option value="custom">Custom...</option>
          </select>
          {model === 'custom' && (
              <input
                type="text"
                placeholder="Enter model name"
                className="mt-2 w-full p-2 border border-gray-300 rounded"
                onChange={(e) => setModel(e.target.value)}
              />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Random Seed</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={seed || ''}
              onChange={handleSeedChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="0 (random)"
            />
            <button
              onClick={generateRandomSeed}
              className="px-3 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
              title="Generate random seed"
            >
              🎲
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Higher variation with temperature 0.9</p>
        </div>
      </div>
    </div>
  );
};
