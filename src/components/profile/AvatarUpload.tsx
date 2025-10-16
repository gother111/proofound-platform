import { useState, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload } from 'lucide-react';
import { motion } from 'motion/react';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

interface AvatarUploadProps {
  avatar: string | null;
  onUpload: (base64: string) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const WARNING_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function AvatarUpload({ avatar, onUpload }: AvatarUploadProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB');
      return;
    }

    if (file.size > WARNING_FILE_SIZE) {
      toast.warning('Large image detected. Compressing before upload.');
    }

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.75,
        maxWidthOrHeight: 1024,
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
      console.error('Image compression failed:', compressionError);
      setError('Could not compress image for upload');
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.02 }}
        onHoverStart={() => setIsHovering(true)}
        onHoverEnd={() => setIsHovering(false)}
        className="cursor-pointer group/avatar"
        onClick={handleClick}
      >
        <Avatar className="w-32 h-32 border-4 border-card shadow-lg ring-2 ring-[rgba(122,146,120,0.2)] ring-offset-2 bg-[#F5F3EE]">
          {avatar ? <AvatarImage src={avatar} className="object-cover" /> : null}
          <AvatarFallback className="bg-[#F5F3EE]">
            <div className="w-full h-full flex items-center justify-center relative">
              <svg viewBox="0 0 100 100" className="w-20 h-20">
                <circle cx="50" cy="40" r="20" fill="none" stroke="#7A9278" strokeWidth="1.5" />
                <path d="M 30 70 Q 50 60 70 70" fill="none" stroke="#7A9278" strokeWidth="1.5" />
              </svg>
              {isHovering && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center"
                >
                  <Upload className="w-6 h-6 text-[#7A9278]" />
                </motion.div>
              )}
            </div>
          </AvatarFallback>
        </Avatar>

        {avatar && isHovering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center w-32 h-32"
          >
            <div className="text-center">
              <Upload className="w-6 h-6 text-[#7A9278] mx-auto mb-1" />
              <span className="text-xs text-[#7A9278]">Change</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload profile picture"
      />

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 text-xs text-red-500 whitespace-nowrap"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
