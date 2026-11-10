import { Linking } from "react-native";
import { Sparkles } from "lucide-react-native";
import { Button } from "@/components/ui";
import { WEB_APP_URL } from "@/lib/api/config";

/**
 * Same button as web's UpgradeToProButton. App-store rules require their own billing for in-app
 * digital purchases, so instead of opening Razorpay here it sends the user to the web dashboard,
 * where the same checkout runs; Pro status then syncs back through /api/user.
 */
export function UpgradeToProButton() {
  return (
    <Button size="sm" icon={Sparkles} accessibilityHint="Opens GetFitBro in your browser" onPress={() => Linking.openURL(`${WEB_APP_URL}/dashboard`)}>
      Upgrade to Pro
    </Button>
  );
}
