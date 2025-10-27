import Sidebar from "../components/Sidebar";
function MainPage() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-neutral-900 text-yellow-200">
      <Sidebar />
      <main className="grow md:ml-64 p-6">
        <h1 className="text-2xl font-bold"> Welcome to TribeTalk</h1>
      </main>
    </div>
  );
}
export default MainPage;
