import React, { useState } from 'react';
import { AiOutlineHome, AiOutlineCompass, AiOutlineHeart, AiOutlineBarChart, AiOutlineSetting, AiOutlineMessage, AiOutlinePlus, AiOutlineSearch, AiOutlineMore } from 'react-icons/ai';
import { BiMicrophone, BiBookmark } from 'react-icons/bi';
import { BsChatDots } from 'react-icons/bs';

export default function MainPage() {
  const [activeTab, setActiveTab] = useState('Popular');

  const stories = [
    { name: 'Gladys', image: 'https://i.pravatar.cc/150?img=1', hasStory: true },
    { name: 'Kristin', image: 'https://i.pravatar.cc/150?img=5', hasStory: true },
    { name: 'Priscilla', image: 'https://i.pravatar.cc/150?img=9', hasStory: true },
    { name: 'Connie', image: 'https://i.pravatar.cc/150?img=10', hasStory: true },
    { name: 'Brenda', image: 'https://i.pravatar.cc/150?img=16', hasStory: true },
    { name: 'Lily', image: 'https://i.pravatar.cc/150?img=20', hasStory: true },
  ];

  const contacts = [
    { name: 'Julie Mendez', location: 'Memphis, TN, US', image: 'https://i.pravatar.cc/150?img=25' },
    { name: 'Mariam Montgomery', location: 'Austin, TX, US', image: 'https://i.pravatar.cc/150?img=28' },
    { name: 'Joyce Reid', location: 'Fort Worth, TX, US', image: 'https://i.pravatar.cc/150?img=32' },
    { name: 'Alice Franklin', location: 'Springfield, MA, US', image: 'https://i.pravatar.cc/150?img=35' },
    { name: 'Domingo Flores', location: 'Honolulu, HI, US', image: 'https://i.pravatar.cc/150?img=38' },
  ];

  const requests = [
    { name: 'Lauralee Quintero', action: 'wants to add you to friends', image: 'https://i.pravatar.cc/150?img=45' },
    { name: 'Brittni Laplante', action: 'wants to add you to friends', image: 'https://i.pravatar.cc/150?img=47' },
  ];

  const suggestions = [
    { name: 'Chantal Shelburne', location: 'Memphis, TN, US', image: 'https://i.pravatar.cc/150?img=50' },
    { name: 'Marci Senter', location: 'Newark, NJ, US', image: 'https://i.pravatar.cc/150?img=52' },
    { name: 'Janetta Rotolo', location: 'Austin, TX, US', image: 'https://i.pravatar.cc/150?img=54' },
    { name: 'Tyra Dhillon', location: 'Bridgeport, MA, US', image: 'https://i.pravatar.cc/150?img=56' },
    { name: 'Mariselle Wigington', location: 'Memphis, TN, US', image: 'https://i.pravatar.cc/150?img=58' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        {/* Profile Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <img
              src="https://i.pravatar.cc/150?img=60"
              alt="Profile"
              className="w-20 h-20 rounded-full"
            />
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-white"></div>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">Cyndy Lillibridge</h2>
          <p className="text-sm text-gray-500">Irvine, CA, United States</p>
          
          <div className="flex gap-8 mt-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">368</div>
              <div className="text-xs text-gray-500">Posts</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">184.3K</div>
              <div className="text-xs text-gray-500">Followers</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">1.04M</div>
              <div className="text-xs text-gray-500">Following</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 mb-8">
          <button className="flex items-center gap-3 w-full px-3 py-2 text-blue-600 bg-blue-50 rounded-lg">
            <AiOutlineHome size={20} />
            <span className="text-sm font-medium">Feed</span>
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
            <AiOutlineCompass size={20} />
            <span className="text-sm font-medium">Explore</span>
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
            <AiOutlineHeart size={20} />
            <span className="text-sm font-medium">My favorites</span>
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
            <AiOutlineMessage size={20} />
            <span className="text-sm font-medium">Direct</span>
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
            <AiOutlineBarChart size={20} />
            <span className="text-sm font-medium">Stats</span>
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
            <AiOutlineSetting size={20} />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </nav>

        {/* Contacts */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Contacts</h3>
          <div className="space-y-2">
            {contacts.map((contact, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <img src={contact.image} alt={contact.name} className="w-10 h-10 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                  <div className="text-xs text-gray-500 truncate">{contact.location}</div>
                </div>
                <BsChatDots size={16} className="text-gray-400" />
              </div>
            ))}
          </div>
          <button className="text-sm text-blue-600 mt-3 font-medium">View ALL</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6">
          {/* Search Bar */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <AiOutlineSearch size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <BiMicrophone size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-shadow">
              <AiOutlinePlus size={20} />
              Create new post
            </button>
          </div>

          {/* Stories */}
          <div className="bg-white rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Stories</h2>
              <button className="text-sm text-blue-600 font-medium">Watch all</button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400">
                  <AiOutlinePlus size={24} className="text-gray-400" />
                </div>
                <span className="text-xs text-gray-600">Add story</span>
              </div>
              {stories.map((story, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-0.5 cursor-pointer">
                    <img src={story.image} alt={story.name} className="w-full h-full rounded-full border-2 border-white" />
                  </div>
                  <span className="text-xs text-gray-600">{story.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Feeds */}
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Feeds</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('Popular')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'Popular' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Popular
                </button>
                <button
                  onClick={() => setActiveTab('Latest')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'Latest' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Latest
                </button>
              </div>
            </div>

            {/* Post */}
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src="https://i.pravatar.cc/150?img=12" alt="Robert Fox" className="w-10 h-10 rounded-full" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Robert Fox</div>
                    <div className="text-xs text-gray-500">@aleksandrhovhannisyan</div>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <AiOutlineMore size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="col-span-1 row-span-2">
                  <img
                    src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500"
                    alt="Nature"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <img
                    src="https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=250"
                    alt="Nature"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1542359649-31e03cd4d909?w=250"
                    alt="Nature"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=250"
                    alt="Nature"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=250"
                      alt="Nature"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl font-semibold">+45</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-3">
                While Corfu give us the ability to shoot by the sea with amazing blue background full of light we chose the...{' '}
                <button className="text-blue-600 font-medium">read more</button>
              </p>
              <div className="flex gap-2 mb-4">
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">#landscape</span>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">#fog</span>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">#nature</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 text-gray-600 hover:text-red-500">
                    <AiOutlineHeart size={20} />
                    <span className="text-sm">8.8k</span>
                  </button>
                  <button className="flex items-center gap-1 text-gray-600 hover:text-blue-500">
                    <BsChatDots size={20} />
                    <span className="text-sm">2.3k</span>
                  </button>
                </div>
                <button className="text-gray-600 hover:text-blue-500">
                  <BiBookmark size={20} />
                </button>
              </div>
            </div>

            {/* Second Post */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src="https://i.pravatar.cc/150?img=44" alt="Dianne Russell" className="w-10 h-10 rounded-full" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Dianne Russell</div>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <AiOutlineMore size={20} />
                </button>
              </div>
              <img
                src="https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=600"
                alt="Post"
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        {/* Requests */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Requests</h3>
            <span className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
              2
            </span>
          </div>
          <div className="space-y-3">
            {requests.map((request, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <img src={request.image} alt={request.name} className="w-10 h-10 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-semibold text-gray-900">{request.name}</span>
                    <span className="text-gray-600"> {request.action}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button className="text-xs text-blue-600 font-medium">Accept</button>
                    <button className="text-xs text-gray-600 font-medium">Decline</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Suggestions for you</h3>
          <div className="space-y-3">
            {suggestions.map((suggestion, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <img src={suggestion.image} alt={suggestion.name} className="w-10 h-10 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{suggestion.name}</div>
                  <div className="text-xs text-gray-500 truncate">{suggestion.location}</div>
                </div>
                <button className="text-blue-600 hover:text-blue-700">
                  <AiOutlinePlus size={18} />
                </button>
              </div>
            ))}
          </div>
          <button className="text-sm text-blue-600 mt-4 font-medium">View All</button>
        </div>

        {/* Followers Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex -space-x-2">
              {[...Array(6)].map((_, i) => (
                <img
                  key={i}
                  src={`https://i.pravatar.cc/150?img=${65 + i}`}
                  alt=""
                  className="w-8 h-8 rounded-full border-2 border-white"
                />
              ))}
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">184.3K</div>
          <div className="text-sm text-gray-500 mb-1">Followers</div>
          <div className="text-xs text-gray-600">Active now on your profile</div>
        </div>

        {/* Footer Links */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-500 space-y-1">
          <div className="flex gap-3">
            <a href="#" className="hover:text-gray-700">About</a>
            <a href="#" className="hover:text-gray-700">Accessibility</a>
            <a href="#" className="hover:text-gray-700">Help Center</a>
          </div>
          <div className="flex gap-3">
            <a href="#" className="hover:text-gray-700">Privacy and Terms</a>
            <a href="#" className="hover:text-gray-700">Advertising</a>
          </div>
          <div>
            <a href="#" className="hover:text-gray-700">Business Services</a>
          </div>
        </div>
      </div>
    </div>
  );
}