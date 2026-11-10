import { Text, View } from "react-native";
import { Camera, Image as ImageIcon } from "lucide-react-native";
import { Button, Modal } from "@/components/ui";

interface ScanSourceModalProps {
  onTakePhoto: () => void;
  onChooseLibrary: () => void;
  onClose: () => void;
}

/** The phone's version of web's file chooser for label photos: camera or photo library. */
export function ScanSourceModal({ onTakePhoto, onChooseLibrary, onClose }: ScanSourceModalProps) {
  const pick = (action: () => void) => () => {
    onClose();
    action();
  };

  return (
    <Modal title="Scan nutrition label(s)" icon={Camera} onClose={onClose}>
      <Text className="font-sans text-sm text-ink-muted">
        Each label is read and saved to your ingredient cache, so later meals naming that product use its exact macros.
      </Text>
      <View className="gap-3">
        <Button fullWidth icon={Camera} onPress={pick(onTakePhoto)}>
          Take photo
        </Button>
        <Button fullWidth variant="outline" icon={ImageIcon} onPress={pick(onChooseLibrary)}>
          Choose from library
        </Button>
      </View>
    </Modal>
  );
}
