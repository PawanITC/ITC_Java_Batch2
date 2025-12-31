import Sidebar from "../components/Sidebar";
import SuggestionSidebar from "../components/Suggestion/SuggestionSibebar";
import MainHeader from "../components/MainHeader";
import PostDetails from "../components/Post/PostDetails";

function PostMain() {
  return (
    <div className="flex bg-white dark:bg-neutral-900 text-gray-900 dark:text-yellow-200 min-h-screen">
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col md:flex-row grow md:ml-64 ml-20">
        {/* Post Feed */}
        <main className="w-full md:w-2/3 max-w-2xl mx-auto">
          <MainHeader />
          <div className="px-4 py-6 space-y-4">
            <PostDetails />
          </div>
        </main>

        {/* Suggestions Sidebar */}
        <SuggestionSidebar />
      </div>
    </div>
  );
}

export default PostMain;
