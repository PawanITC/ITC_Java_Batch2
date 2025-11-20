import { useContext } from "react";
import { ThemeContext } from "../ThemeProvider";
import { MoonIcon, Sun, SunIcon } from "lucide-react";

export default function ThemeToggleButton() {
    const { theme, toggleTheme } = useContext(ThemeContext);

    return (
        <button className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-yellow-300 transition-colors duration-300"
      title="Toggle theme"onClick={toggleTheme}>
            
            {theme === 'dark' ? (
                <><SunIcon size={20} /><span className="sr-only">Switch to light mode</span></>
            ) : (
                
                <><MoonIcon size={20} /><span className="sr-only">Switch to dark mode</span></>
            )}
        </button>
    );
}