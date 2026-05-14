"use client";

import { useState } from "react";
import ProfileForm from "@/components/ProfileForm";
import ChatInterface from "@/components/ChatInterface";
import { PlayerProfile } from "@/lib/prompt";

export default function Home() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  if (!profile) {
    return <ProfileForm onSubmit={setProfile} />;
  }

  return (
    <ChatInterface
      profile={profile}
      onEditProfile={() => setProfile(null)}
    />
  );
}
