const GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-500",
  "from-pink-500 to-rose-600",
  "from-amber-500 to-yellow-500",
  "from-indigo-500 to-blue-600",
  "from-teal-500 to-green-600",
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

interface AvatarProps {
  name: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-xl",
};

export function Avatar({ name, image, size = "md", className = "" }: AvatarProps) {
  const displayName = name || "?";
  const initial = displayName[0].toUpperCase();
  const sizeClass = SIZES[size];

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={displayName}
        className={`${sizeClass} object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  const gradient = getGradient(displayName);

  return (
    <div className={`${sizeClass} bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-bold flex-shrink-0 ${className}`}>
      {initial}
    </div>
  );
}
