import ThemeToggleButton from "./ThemeToggleButton";

function MainHeader() {
  return (
    <div className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-yellow-700/40 px-6 py-4 h-20 flex items-center justify-between">
      <h1 className="text-xl font-bold text-gray-900 dark:text-yellow-100">
        Welcome to TribeTalk
      </h1>
      <ThemeToggleButton />
    </div>
  );
}

export default MainHeader;
