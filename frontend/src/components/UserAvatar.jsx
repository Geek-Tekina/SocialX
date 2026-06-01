import { AutoAwesome, Bolt, LocalFlorist, Whatshot, Spa, Public } from "@mui/icons-material";
import AnimatedAvatar from "./ui/AnimatedAvatar";

export const AVATAR_OPTIONS = [
  { id: "nova", label: "Nova", color: "#4F46E5", icon: AutoAwesome },
  { id: "pulse", label: "Pulse", color: "#2563EB", icon: Bolt },
  { id: "bloom", label: "Bloom", color: "#DB2777", icon: LocalFlorist },
  { id: "ember", label: "Ember", color: "#EA580C", icon: Whatshot },
  { id: "mint", label: "Mint", color: "#0D9488", icon: Spa },
  { id: "slate", label: "Orbit", color: "#475569", icon: Public },
];

export const getAvatarOption = (avatar) =>
  AVATAR_OPTIONS.find((item) => item.id === avatar) || AVATAR_OPTIONS[0];

const UserAvatar = ({ avatar, username, sx = {}, iconSx = {}, ...props }) => {
  const selected = getAvatarOption(avatar);
  const Icon = selected.icon;

  return (
    <AnimatedAvatar
      sx={{
        color: "#fff",
        ...sx,
        bgcolor: selected.color,
      }}
      {...props}
    >
      <Icon
        aria-label={username || selected.label}
        sx={{ fontSize: "58%", ...iconSx }}
      />
    </AnimatedAvatar>
  );
};

export default UserAvatar;
