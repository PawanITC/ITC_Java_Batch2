
import Sidebar from "../components/Sidebar";
import PostCard from "../components/Post/PostCard";
import SuggestionSidebar from "../components/Suggestion/SuggestionSibebar";
import MainHeader from "../components/MainHeader";

function MainPage() {
  return (
    <div className="flex bg-neutral-900 text-yellow-200 min-h-screen">
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col md:flex-row grow md:ml-64 ml-20">
        {/* Post Feed */}
        <main className="w-full md:w-2/3 max-w-2xl mx-auto">
          <MainHeader />
          <div className="px-4 py-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <PostCard key={i} />
            ))}
          </div>
        </main>

        {/* Suggestions Sidebar */}
        <SuggestionSidebar />
      </div>
    </div>
  );
}

export default MainPage;