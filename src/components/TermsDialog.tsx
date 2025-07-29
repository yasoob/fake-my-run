import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TermsDialog: React.FC<TermsDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen sm:max-h-[80vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogDescription>
            Please read our terms and conditions carefully.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p>
            Welcome to Fake my run ("we", "our", "us"). These Terms and
            Conditions ("Terms") govern your access to and use of the Fake my
            run application (the "App") and any related services.
          </p>
          <p className="font-medium">
            By using the App, you agree to be bound by these Terms. If you do
            not agree, you may not use the App.
          </p>

          <h3 className="font-semibold text-base">1. Purpose of the App</h3>
          <p>
            The App is intended for entertainment, testing, and personal
            simulation purposes only. It allows users to generate synthetic
            activity data (e.g., running, cycling) which does not represent
            actual physical activity.
          </p>

          <h3 className="font-semibold text-base">2. User Responsibilities</h3>
          <p>You agree that you will:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Only use the App in accordance with all applicable local,
              national, and international laws and regulations.
            </li>
            <li>
              Not use the App to misrepresent or falsify any fitness or activity
              data in contexts where accuracy is expected or required, such as:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>
                  Participating in fitness competitions, leaderboards, or
                  challenges.
                </li>
                <li>
                  Applying for rewards, sponsorships, or monetary benefits.
                </li>
                <li>
                  Uploading to third-party services (e.g., Strava, Garmin
                  Connect) in violation of their terms of service.
                </li>
              </ul>
            </li>
          </ul>
          <p className="mt-2">
            You understand and acknowledge that uploading fake or manipulated
            activity data to third-party services may breach their terms and
            could result in suspension or termination of your account on those
            platforms.
          </p>

          <h3 className="font-semibold text-base">3. Third-Party Services</h3>
          <p>
            We are not affiliated with, endorsed by, or partnered with any
            third-party services such as Strava, Garmin Connect, or any other
            fitness or health platform. You use the App at your own risk, and
            you are solely responsible for ensuring that your use of the App
            does not violate any third-party terms or agreements.
          </p>

          <h3 className="font-semibold text-base">4. No Warranty</h3>
          <p>
            The App is provided "as is" and "as available" without any
            warranties, express or implied, including but not limited to
            warranties of merchantability, fitness for a particular purpose, or
            non-infringement.
          </p>
          <p>
            We do not warrant that the App will be secure, available at any
            particular time or location, or free of errors or defects.
          </p>

          <h3 className="font-semibold text-base">
            5. Limitation of Liability
          </h3>
          <p>
            To the fullest extent permitted by applicable law, we shall not be
            liable for any direct, indirect, incidental, consequential, or
            punitive damages arising out of or relating to your use of (or
            inability to use) the App, including any damages resulting from
            misuse of generated data.
          </p>
          <p>
            You assume full responsibility for any consequences resulting from
            your use of the App, including any disciplinary actions by
            third-party platforms.
          </p>

          <h3 className="font-semibold text-base">6. Indemnification</h3>
          <p>
            You agree to indemnify, defend, and hold harmless Fake my run, its
            affiliates, officers, employees, and agents from and against any and
            all claims, liabilities, damages, losses, or expenses (including
            legal fees) arising out of or in connection with:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Your use or misuse of the App.</li>
            <li>Your violation of these Terms.</li>
            <li>Your violation of any applicable law or third-party right.</li>
          </ul>

          <h3 className="font-semibold text-base">7. Changes to These Terms</h3>
          <p>
            We reserve the right to modify or update these Terms at any time.
            Your continued use of the App after changes have been made
            constitutes your acceptance of the updated Terms.
          </p>

          <h3 className="font-semibold text-base">8. Governing Law</h3>
          <p>
            These Terms shall be governed by and construed in accordance with
            the laws of [Insert Jurisdiction], without regard to its conflict of
            law provisions.
          </p>

          <div className="pt-4 border-t">
            <h3 className="font-semibold text-base">Disclaimer</h3>
            <p className="italic">
              This application is not intended to promote dishonest or
              fraudulent behavior. Users who choose to misuse the App do so
              entirely at their own risk and may face consequences from
              third-party platforms or legal bodies.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsDialog;
