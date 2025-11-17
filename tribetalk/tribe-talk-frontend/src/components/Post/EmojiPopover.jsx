import {useEffect, useRef} from "react";
import EmojiPicker from "emoji-picker-react";

export default function EmojiPopover({onClose, onSelect}) {
    const popoverRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={popoverRef}
            className="absolute bottom-16 left-4 z-50 bg-neutral-900 border border-yellow-700 rounded-md shadow-lg"
        >
            <EmojiPicker
                onEmojiClick={(emojiData) => onSelect(emojiData.emoji)}
                theme="dark"
            />
        </div>
    );
}
