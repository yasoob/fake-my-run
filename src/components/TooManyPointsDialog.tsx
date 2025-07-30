import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface TooManyPointsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TooManyPointsDialog: React.FC<TooManyPointsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Too Many Points Selected
          </DialogTitle>
          <DialogDescription>
            You can only align up to 25 points at a time. Please select fewer
            points and try again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            className="hover:cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TooManyPointsDialog;
