import { useState } from "react";
import FullscreenMediaModal from "./FullscreenMediaModal";

function MediaCollage({ media }) {
  const [showModal, setShowModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  const openModal = (e, i) => {
    e.stopPropagation();
    setModalIndex(i);
    setShowModal(true);
  };

  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-2",
    4: "grid-cols-2",
  }[Math.min(media.length, 4)];

  return (
    <div className={`grid ${gridClass} gap-2 mt-3 rounded-md overflow-hidden`}>
      {media.slice(0, 4).map((item, i) => (
        <div
          key={i}
          className="relative cursor-pointer border border-yellow-700/30 bg-black"
          onClick={(e) => openModal(e, i)}
        >
          {item.type.startsWith("video") ? (
            <video
              src={item.url}
              className="w-full h-full object-cover max-h-[200px]"
              muted
              playsInline
            />
          ) : (
            <img
              src={item.url}
              alt={`media-${i}`}
              className="w-full h-full object-cover max-h-[200px]"
            />
          )}

          {/* Overlay for extra images */}
          {i === 3 && media.length > 4 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-gray-700 dark:text-yellow-200 text-xl font-bold">
              +{media.length - 4}
            </div>
          )}
        </div>
      ))}

      {/* Fullscreen modal */}
      {showModal && (
        <FullscreenMediaModal
          media={media}
          index={modalIndex}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
export default MediaCollage;