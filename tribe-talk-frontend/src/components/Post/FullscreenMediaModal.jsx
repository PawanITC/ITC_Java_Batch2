import { useState } from "react";

function FullscreenMediaModal({ media, index, onClose }) {
  const [current, setCurrent] = useState(index);

  const next = () => setCurrent((prev) => (prev + 1) % media.length);
 // const prev = () => setCurrent((prev - 1 + media.length) % media.length);
const prev = () => setCurrent((prev) => (prev - 1 + media.length) % media.length);

  const item = media[current];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-90 z-9999 flex items-center justify-center"
    >
      {/* ✅ Floating controls container */}
      <div
        className="relative max-w-[90%] max-h-[90%] p-8 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ✅ Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-[5%] right-[5%] bg-black/60 hover:bg-black/80 px-3 py-1 rounded-full text-gray-700 dark:text-yellow-200 text-2xl font-bold z-10000"
        >
          ✕
        </button>

        {/* ✅ Media */}
        {item.type.startsWith("video") ? (
          <video
            src={item.url}
            controls
            className="max-w-full max-h-full rounded-md z-9999"
          />
        ) : (
          <img
            src={item.url}
            alt="preview"
            className="max-w-full max-h-full rounded-md z-9000"
          />
        )}

        {/* ✅ Arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-[2%] top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 px-3 py-1 rounded-full text-gray-700 dark:text-yellow-200 text-4xl font-bold z-10000"
            >
              ‹
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-[2%] top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 px-3 py-1 rounded-full text-gray-700 dark:text-yellow-200 text-4xl font-bold z-10000"
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default FullscreenMediaModal;
