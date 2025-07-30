import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TokenDialogProps {
  isOpen: boolean;
  currentToken: string;
  onClose: () => void;
  onSave: (token: string) => void;
}

function TokenDialog({
  isOpen,
  currentToken,
  onClose,
  onSave,
}: TokenDialogProps) {
  const [tempToken, setTempToken] = useState(currentToken);

  // Reset temp token when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTempToken(currentToken);
    }
  }, [isOpen, currentToken]);

  const handleSave = () => {
    onSave(tempToken);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Set Mapbox Access Token</DialogTitle>
          <DialogDescription>
            Enter your Mapbox access token. This will be saved locally and will
            not be shared with us. You can get a free token from{" "}
            <a
              className="text-red-500 underline"
              href="https://www.mapbox.com/signup/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mapbox
            </a>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            type="text"
            value={tempToken}
            onChange={(e) => setTempToken(e.target.value)}
            placeholder="pk.your_token_here"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="hover:cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button className="hover:cursor-pointer" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TokenDialog;
