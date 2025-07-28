import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";

const Index = () => {
  const handleDemoClick = () => {
    window.location.href = '/nfc/?code=DEMO123';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="card-glow max-w-md p-8 text-center">
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-glow-purple">OYIEE Profile</h1>
            <p className="text-neon-cyan font-semibold">NFC-Based Digital Identity</p>
            <p className="text-foreground/80 leading-relaxed">
              Tap your OYIEE T-shirt's NFC tag to access your digital profile
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-6xl mb-4">🏷️</div>
            <p className="text-sm text-muted-foreground">
              This page is accessed by scanning NFC tags embedded in official OYIEE merchandise
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-foreground/80 leading-relaxed">
              Buy OYIEE T-shirt to create OYIEE profile
            </p>
            
            <Button
              variant="neon-cyan"
              className="w-full"
              onClick={() => window.open('https://instagram.com/oyieeofficial', '_blank')}
            >
              <Instagram className="w-4 h-4" />
              Visit OYIEE Official
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Index;
