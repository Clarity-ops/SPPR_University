const Layout = ({
  children,
  projects,
  selectedProjectId,
  onSelectProject,
  onAddProject,
  loading,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              S
            </div>
            <h1 className="text-xl font-bold text-gray-950">
              DSS <span className="text-gray-500 font-medium">Matrix</span>
            </h1>
          </div>
          <div className="text-sm text-gray-500">Mock User ID: 1</div>
        </nav>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-8 gap-8">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              My Projects
            </h2>
            <button
              onClick={onAddProject}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
              title="Create new project"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          {loading && (
            <p className="text-gray-500 text-sm">Loading projects...</p>
          )}
          <ul className="space-y-2">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  onClick={() => onSelectProject(project.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition duration-150 flex flex-col gap-0.5
                    ${
                      selectedProjectId === project.id
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-inner'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-950'
                    }`}
                >
                  {project.name}
                  {project.description && (
                    <span className="text-xs text-gray-500 font-normal line-clamp-1">
                      {project.description}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
