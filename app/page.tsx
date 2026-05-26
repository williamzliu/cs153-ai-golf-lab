"use client";

import { useState, useEffect } from "react";
import ProfileForm from "@/components/ProfileForm";
import ChatInterface from "@/components/ChatInterface";
import { PlayerProfile } from "@/lib/prompt";

const PROFILE_KEY = "aigolflab_profile";

export default function Home() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        setProfile(JSON.parse(saved));
        setIsEditing(false);
      }
    } catch {}
  }, []);

  function handleSetProfile(p: PlayerProfile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    setProfile(p);
    setIsEditing(false);
  }

  if (isEditing) {
    return <ProfileForm onSubmit={handleSetProfile} initialValues={profile ?? undefined} />;
  }

  return (
    <ChatInterface
      profile={profile!}
      onEditProfile={() => setIsEditing(true)}
    />
  );
}
