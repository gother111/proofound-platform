import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

interface CoverUploadProps {
  coverImage: string | null;
  onUpload: (base64: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const WARNING_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function CoverUpload({ coverImage, onUpload }: CoverUploadProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB');
      return;
    }

    if (file.size > WARNING_FILE_SIZE) {
      toast.warning('Large image detected. Compressing before upload.');
    }

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onUpload(base64);
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to upload image');
      };
      reader.readAsDataURL(compressed);
    } catch (compressionError) {
      console.error('Cover image compression failed:', compressionError);
      setError('Could not compress cover image for upload');
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <motion.div
        onHoverStart={() => setIsHovering(true)}
        onHoverEnd={() => setIsHovering(false)}
        onClick={handleClick}
        className="h-48 cursor-pointer relative overflow-hidden"
      >
        {/* Cover image or gradient background */}
        {coverImage ? (
          <Image
            src={coverImage}
            alt="Cover"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-[#7A9278]/20 via-[#C67B5C]/10 to-[#5C8B89]/20 relative">
            <div className="absolute inset-0 opacity-30">
              {/* Subtle network pattern */}
              <svg className="w-full h-full">
                <defs>
                  <pattern
                    id="network-pattern-empty"
                    x="0"
                    y="0"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="20" cy="20" r="1" fill="currentColor" className="text-[#7A9278]" />
                    <line
                      x1="20"
                      y1="20"
                      x2="40"
                      y2="20"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-[#7A9278]"
                      opacity="0.3"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#network-pattern-empty)" />
              </svg>
            </div>
          </div>
        )}

        {/* Hover overlay */}
        {isHovering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="bg-card/90 backdrop-blur-sm rounded-full px-6 py-3 flex items-center gap-2 border-2 border-[#7A9278]/30">
              <Upload className="w-4 h-4 text-[#7A9278]" />
              <span className="text-sm">
                {coverImage ? 'Change cover image' : 'Add cover image'}
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload cover image"
      />

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 mt-2 text-xs text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
