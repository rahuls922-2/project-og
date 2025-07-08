import React, { useState, useEffect } from 'react';
import { Download, Eye, RotateCcw, Zap, Code, Globe, FileText, ExternalLink } from 'lucide-react';

const CursorWebsiteGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [fullScreenPreview, setFullScreenPreview] = useState(false);
  const [showCodeView, setShowCodeView] = useState(false);

  // Load history from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('cursor_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // Save to history
  const saveToHistory = (prompt, code) => {
    const newEntry = { 
      id: Date.now(), 
      prompt: prompt.substring(0, 100) + '...', 
      code, 
      timestamp: new Date().toLocaleString() 
    };
    const newHistory = [newEntry, ...history.slice(0, 4)];
    setHistory(newHistory);
    localStorage.setItem('cursor_history', JSON.stringify(newHistory));
  };

  // Generate website
  const generateWebsite = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your website');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedCode('');
    setShowPreview(false);

    try {
      // Mock API call - replace with actual Gemini API endpoint
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error('Failed to generate website');
      }

      const data = await response.json();
      
      // If API fails, use mock data for demo
      const mockCode = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Website</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            text-align: center; 
        }
        h1 { 
            font-size: 3em; 
            margin-bottom: 20px; 
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .content { 
            background: rgba(255,255,255,0.1); 
            padding: 30px; 
            border-radius: 15px; 
            backdrop-filter: blur(10px);
        }
        .btn {
            padding: 12px 24px;
            background: #ff6b6b;
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
            transition: transform 0.3s ease;
        }
        .btn:hover { transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="container">
        <h1>Website Generated!</h1>
        <div class="content">
            <p>Your idea: "${prompt}"</p>
            <p>This is a dynamically generated website based on your prompt.</p>
            <button class="btn" onclick="alert('Hello from generated site!')">Click Me!</button>
        </div>
    </div>
    <script>
        console.log('Generated website loaded successfully!');
    </script>
</body>
</html>`;

      const combinedCode = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Generated Website</title>
  <style>
    ${data.css || ''}
  </style>
</head>
<body>
  ${data.html || ''}
  <script>
    ${data.js || ''}
  </script>
</body>
</html>`;

setGeneratedCode(combinedCode);
saveToHistory(prompt, combinedCode);
setShowPreview(true);

    } catch (err) {
      setError('Generation failed. Please try again.');
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Download as ZIP
  const downloadZip = () => {
    if (!generatedCode) return;

    // Create ZIP content with multiple files
    const files = {
      'index.html': generatedCode,
      'README.md': `# Generated Website\n\nPrompt: ${prompt}\n\nGenerated on: ${new Date().toLocaleString()}\n\n## Files:\n- index.html: Main website file\n\n## Usage:\nOpen index.html in your browser to view the website.`
    };

    // Create downloadable ZIP (simplified approach)
    const htmlContent = generatedCode;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'generated-website.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Load from history
  const loadFromHistory = (item) => {
    setGeneratedCode(item.code);
    setShowPreview(true);
    setPrompt(item.prompt);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Full Screen Preview Modal */}
      {fullScreenPreview && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-orange-500">
            <h3 className="text-xl font-bold text-orange-400">Full Preview</h3>
            <button
              onClick={() => setFullScreenPreview(false)}
              className="px-4 py-2 bg-orange-500 text-black rounded-lg hover:bg-orange-400 transition-colors"
            >
              Close
            </button>
          </div>
          <iframe
            srcDoc={generatedCode}
            className="w-full h-full"
            title="Full Website Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-12 p-8 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-2xl border-2 border-orange-500/30">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Globe className="w-10 h-10 text-orange-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              Cursor Website Generator
            </h1>
          </div>
          <p className="text-gray-300 text-lg">Transform your ideas into stunning websites instantly</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-orange-500/5 p-6 rounded-2xl border-2 border-orange-500/20">
              <label className="block text-orange-400 font-semibold mb-3 text-lg">
                <Code className="inline w-5 h-5 mr-2" />
                Describe Your Website
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Create a modern portfolio website with dark theme, animated sections, and contact form..."
                className="w-full p-4 bg-black/70 border-2 border-orange-500/30 rounded-xl text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                rows="4"
              />
              {error && (
                <p className="text-red-400 mt-2 text-sm">{error}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={generateWebsite}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-black font-bold rounded-xl hover:from-orange-400 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
                {loading ? 'Generating...' : 'Generate Website'}
              </button>

              {generatedCode && (
                <>
                  <button
                    onClick={() => setFullScreenPreview(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-transparent border-2 border-orange-500 text-orange-400 font-bold rounded-xl hover:bg-orange-500/10 transition-all duration-300"
                  >
                    <Eye className="w-5 h-5" />
                    Full Preview
                  </button>
                  <button
                    onClick={downloadZip}
                    className="flex items-center gap-2 px-6 py-3 bg-transparent border-2 border-orange-500 text-orange-400 font-bold rounded-xl hover:bg-orange-500/10 transition-all duration-300"
                  >
                    <Download className="w-5 h-5" />
                    Download ZIP
                  </button>
                  <button
                    onClick={() => setShowCodeView(!showCodeView)}
                    className="flex items-center gap-2 px-6 py-3 bg-transparent border-2 border-orange-500 text-orange-400 font-bold rounded-xl hover:bg-orange-500/10 transition-all duration-300"
                  >
                    <FileText className="w-5 h-5" />
                    {showCodeView ? 'Hide Code' : 'View Code'}
                  </button>
                  <button
                    onClick={() => window.open('data:text/html;charset=utf-8,' + encodeURIComponent(generatedCode), '_blank')}
                    className="flex items-center gap-2 px-6 py-3 bg-transparent border-2 border-orange-500 text-orange-400 font-bold rounded-xl hover:bg-orange-500/10 transition-all duration-300"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Open in New Tab
                  </button>
                  <button
                    onClick={generateWebsite}
                    className="flex items-center gap-2 px-6 py-3 bg-transparent border-2 border-orange-500 text-orange-400 font-bold rounded-xl hover:bg-orange-500/10 transition-all duration-300"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Regenerate
                  </button>
                </>
              )}
            </div>

            {/* Code View Section */}
            {showCodeView && generatedCode && (
              <div className="bg-orange-500/5 p-6 rounded-2xl border-2 border-orange-500/20 mb-6">
                <h3 className="text-xl font-bold text-orange-400 mb-4">Generated Code</h3>
                <div className="bg-black/70 rounded-xl p-4 overflow-auto max-h-96">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                    <code>{generatedCode}</code>
                  </pre>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedCode)}
                    className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors text-sm"
                  >
                    Copy Code
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([generatedCode], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'website-code.html';
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors text-sm"
                  >
                    Save as File
                  </button>
                </div>
              </div>
            )}

            {/* Live Preview */}
            {showPreview && generatedCode && (
              <div className="bg-orange-500/5 p-6 rounded-2xl border-2 border-orange-500/20">
                <h3 className="text-xl font-bold text-orange-400 mb-4">Live Preview</h3>
                <div className="bg-black/50 rounded-xl overflow-hidden">
                  <iframe
                    srcDoc={generatedCode}
                    className="w-full h-96 border-0"
                    title="Website Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            )}
          </div>

          {/* History Sidebar */}
          <div className="bg-orange-500/5 p-6 rounded-2xl border-2 border-orange-500/20 h-fit">
            <h3 className="text-xl font-bold text-orange-400 mb-4">Recent Projects</h3>
            {history.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No projects yet. Generate your first website!</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-black/50 rounded-lg border border-orange-500/20 hover:border-orange-500/40 cursor-pointer transition-all duration-200"
                    onClick={() => loadFromHistory(item)}
                  >
                    <p className="text-sm text-white truncate">{item.prompt}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.timestamp}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
            <div className="bg-gray-900 p-8 rounded-2xl border-2 border-orange-500/30 text-center">
              <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-orange-400 text-lg font-semibold">Generating your website...</p>
              <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CursorWebsiteGenerator;