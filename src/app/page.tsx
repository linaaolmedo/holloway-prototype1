export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center px-6 py-12 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            🚧
          </h1>
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Under Construction
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            We're working hard to bring you something amazing. 
            <br />
            Stay tuned for updates!
          </p>
        </div>
        
        <div className="animate-pulse">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
