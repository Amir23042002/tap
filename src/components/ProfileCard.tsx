import { UserProfile } from "@/lib/firestore";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, MessageCircle, Instagram, Facebook } from "lucide-react";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

interface ProfileCardProps {
  profile: UserProfile;
  className?: string;
}

export const ProfileCard = ({ profile, className = "" }: ProfileCardProps) => {
  const [user] = useAuthState(auth);
  const isOwner = user && user.uid === profile.userId;

  const handleContactClick = (type: string, value: string) => {
    let url = '';
    switch (type) {
      case 'phone':
        url = `tel:${value}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/${value.replace(/\D/g, '')}`;
        break;
      case 'instagram':
        url = `https://instagram.com/${value.replace('@', '')}`;
        break;
      case 'facebook':
        url = `https://facebook.com/${value}`;
        break;
    }
    if (url) window.open(url, '_blank');
  };

  return (
    <Card className={`card-glow p-8 text-center ${className}`}>
      <div className="space-y-6">
        <Avatar className="w-32 h-32 mx-auto ring-2 ring-golden">
          <AvatarImage src={profile.photo} alt={profile.name} />
          <AvatarFallback className="text-2xl bg-secondary text-golden">
            {profile.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-glow-golden">{profile.name}</h1>
          <p className="text-golden">@{profile.username}</p>
          {isOwner && (
            <p className="text-golden/70">{profile.email}</p>
          )}
        </div>
        
        {profile.bio && (
          <p className="text-golden/80 max-w-md mx-auto leading-relaxed">
            {profile.bio}
          </p>
        )}

        {/* Contact Links */}
        <div className="space-y-4 max-w-sm mx-auto">
          {profile.phone && (
            <button
              onClick={() => handleContactClick('phone', profile.phone)}
              className="flex items-center justify-between w-full p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-golden" />
                <span className="text-golden font-medium">Phone</span>
              </div>
              <span className="text-golden/70">{profile.phone}</span>
            </button>
          )}
          
          {profile.whatsapp && (
            <button
              onClick={() => handleContactClick('whatsapp', profile.whatsapp)}
              className="flex items-center justify-between w-full p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-golden" />
                <span className="text-golden font-medium">WhatsApp</span>
              </div>
              <span className="text-golden/70">{profile.whatsapp}</span>
            </button>
          )}
          
          {profile.instagram && (
            <button
              onClick={() => handleContactClick('instagram', profile.instagram)}
              className="flex items-center justify-between w-full p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Instagram className="w-5 h-5 text-golden" />
                <span className="text-golden font-medium">Instagram</span>
              </div>
              <span className="text-golden/70">@{profile.instagram}</span>
            </button>
          )}
          
          {profile.facebook && (
            <button
              onClick={() => handleContactClick('facebook', profile.facebook)}
              className="flex items-center justify-between w-full p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Facebook className="w-5 h-5 text-golden" />
                <span className="text-golden font-medium">Facebook</span>
              </div>
              <span className="text-golden/70">{profile.facebook}</span>
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};