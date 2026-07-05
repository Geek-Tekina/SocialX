import { AutoAwesome, Bolt, LocalFlorist, Whatshot, Spa, Public } from "@mui/icons-material";
import AnimatedAvatar from "./ui/AnimatedAvatar";

export const AVATAR_OPTIONS = [
  { id: "nova", label: "Nova", color: "#111111", icon: AutoAwesome },
  { id: "pulse", label: "Pulse", color: "#1F1F1F", icon: Bolt },
  { id: "bloom", label: "Bloom", color: "#2B2B2B", icon: LocalFlorist },
  { id: "ember", label: "Ember", color: "#363636", icon: Whatshot },
  { id: "mint", label: "Mint", color: "#4A4A4A", icon: Spa },
  { id: "slate", label: "Orbit", color: "#6B7280", icon: Public },
];

export const getAvatarOption = (avatar) =>
  AVATAR_OPTIONS.find((item) => item.id === avatar) || AVATAR_OPTIONS[0];

const UserAvatar = ({ avatar, profileImageUrl, username, sx = {}, iconSx = {}, ...props }) => {
  const selected = getAvatarOption(avatar);
  const Icon = selected.icon;
  const hasImage = Boolean(profileImageUrl);

  return (
    <AnimatedAvatar
      sx={{
        color: "#fff",
        ...sx,
        bgcolor: selected.color,
      }}
      src={hasImage ? profileImageUrl : undefined}
      alt={username || selected.label}
      {...props}
    >
      {!hasImage && (
        <Icon
          aria-label={username || selected.label}
          sx={{ fontSize: "58%", ...iconSx }}
        />
      )}
    </AnimatedAvatar>
  );
};

export default UserAvatar;
