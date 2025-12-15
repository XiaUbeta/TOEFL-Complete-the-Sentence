import { useState, useEffect } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { QuestionArea } from './components/QuestionArea';
import { FeedbackArea } from './components/FeedbackArea';
import { generateQuestion, gradeAnswers, type QuestionData, type FeedbackData } from './services/ai';
import { Loader2 } from 'lucide-react';

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('siliconflow_api_key') || '');
  const [model, setModel] = useState('deepseek-ai/DeepSeek-V3');
  
  useEffect(() => {
    localStorage.setItem('siliconflow_api_key', apiKey);
  }, [apiKey]);
  
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!apiKey) {
      setError("Please enter your SiliconFlow API Key first.");
      return;
    }
    setError(null);
    setIsLoading(true);
    setQuestion(null);
    setFeedback(null);
    setUserAnswers({});
    
    try {
      const data = await generateQuestion(apiKey, model);
      setQuestion(data);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (err as any).response?.data?.error?.message || "Failed to generate question. Please check your API key and model.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!question) return;
    setIsSubmitting(true);
    setError(null);
    
    try {
      const data = await gradeAnswers(apiKey, model, question, userAnswers);
      setFeedback(data);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (err as any).response?.data?.error?.message || "Failed to grade answers.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    setUserAnswers(prev => ({ ...prev, [index]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TOEFL Essentials Practice</h1>
          <p className="text-gray-600">Complete the Sentence - AI Powered</p>
        </header>

        <ConfigPanel 
          apiKey={apiKey} 
          setApiKey={setApiKey} 
          model={model} 
          setModel={setModel} 
        />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            {error}
          </div>
        )}

        {!question && !isLoading && (
          <div className="text-center py-12">
            <button 
              onClick={handleGenerate}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-lg transition-transform transform hover:scale-105"
            >
              Start New Practice
            </button>
            <p className="mt-4 text-gray-500 text-sm">
              Click to generate a new paragraph test using AI.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-teal-600 mb-4" size={48} />
            <p className="text-gray-600">Generating question... This may take a few seconds.</p>
          </div>
        )}

        {question && (
          <QuestionArea
            topic={question.topic}
            segments={question.segments}
            userAnswers={userAnswers}
            handleInputChange={handleInputChange}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {feedback && <FeedbackArea feedback={feedback} />}
        
        {/* Reset Button when done */}
        {feedback && (
           <div className="text-center mt-8 pb-12">
             <button
               onClick={handleGenerate}
               className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-6 rounded shadow transition-colors"
             >
               Try Another Question
             </button>
           </div>
        )}
      </div>
    </div>
  );
}

export default App;
